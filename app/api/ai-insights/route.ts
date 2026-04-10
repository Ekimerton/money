import { NextRequest } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';

type ChartType = 'cumulative' | 'pie' | 'area' | 'bar';

type ModelResponse = {
    sql: string;
    chart: ChartType;
};

const dbPath = path.join(process.cwd(), './data/user_data.db');

function getGeminiClient() {
    const settingsPath = path.join(process.cwd(), './data/user-settings.json');
    let apiKey = '';
    try {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        apiKey = String(parsed?.geminiApiKey || '').trim();
    } catch (_) {
        // fall through to error below
    }
    if (!apiKey) {
        throw new Error('Missing Gemini API key. Please add geminiApiKey to data/user-settings.json');
    }
    return new GoogleGenerativeAI(apiKey);
}

function buildSchemaDescription(categories: string[]): string {
    const categoriesSection = categories.length
        ? `\nCategory values present in data (case-sensitive; exclude 'Internal Transfer' in queries):\n${categories
            .map((c) => `- ${c}`)
            .join('\n')}\n`
        : '';

    return `
You are helping generate SQLite SQL for a personal finance app.

Database schema (SQLite) - use only these tables/columns:

Table accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance TEXT NOT NULL,           -- string amount
  balance_date INTEGER NOT NULL,   -- unix seconds
  type TEXT DEFAULT 'uncategorized'
);

Table transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  posted INTEGER,                  -- unix seconds
  amount TEXT,                     -- signed string; expenses are negative
  description TEXT,                -- sometimes can be used in place of payee
  payee TEXT NULL,
  transacted_at INTEGER,           -- unix seconds
  pending INTEGER,                 -- 0/1
  hidden INTEGER,                  -- 0/1
  category TEXT                    -- includes 'Internal Transfer'
);
${categoriesSection}
Rules:
- Always filter out hidden = 1 and category = 'Internal Transfer'.
- For spend analyses, use amount < 0 and ABS(CAST(amount AS REAL)) for magnitude.
- If grouping by date, convert transacted_at (seconds) to days using DATE(transacted_at, 'unixepoch').
- ONLY return SQLite-compatible SQL. No comments. No backticks.
- Limit to reasonable rows when returning time series (e.g., don't group by too granularly without a date).

Chart types allowed and selection heuristics:
- bar: BEST DEFAULT. Use for categorical comparisons (e.g., top 5 spenders, category totals) AND discrete time-series (e.g., daily/monthly spend). For time-series, return a 'date' column + series columns. For categorical, return 'label' and 'value' columns.
- pie: Use for composition or percentage breakdowns (e.g., spending by category).
- cumulative: Use ONLY if the user explicitly asks for 'cumulative', 'running total', or 'growth over time'.
- area: Use ONLY for continuous, dense time-series trends (line-chart). Do NOT use for simple categories or sparse data; prefer 'bar' for those.

Output column naming rules:
- Time series charts (cumulative, area, bar): name the date column exactly 'date' (lowercase) using DATE(transacted_at,'unixepoch').
- Categorical bar and pie charts: return 'label' and 'value' columns (lowercase).
`;
}

export async function POST(req: NextRequest) {
    let dbToClose: Database.Database | null = null;
    try {
        const body = await req.json();
        const prompt: string = String(body?.prompt || '').trim();
        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
        }

        // Read existing categories from the database to help guide the model
        let categories: string[] = [];
        try {
            const catDb = new Database(dbPath, { readonly: true });
            try {
                const rows = catDb
                    .prepare(
                        "SELECT DISTINCT category AS category FROM transactions WHERE hidden = 0 AND category IS NOT NULL AND TRIM(category) <> '' AND category <> 'Internal Transfer' ORDER BY category ASC"
                    )
                    .all() as Array<{ category: string }>;
                categories = rows.map((r) => r.category);
            } finally {
                catDb.close();
            }
        } catch (_) {
            // ignore and proceed without categories context
        }

        const genAI = getGeminiClient();
        
        const exploreDatabaseDeclaration: FunctionDeclaration = {
            name: "explore_database",
            description: "Run a read-only SQLite query to explore the data schema or see samples of data. This does NOT generate a chart, but helps you understand what is available to write the final query. Limit exploratory queries to 10 rows.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    sql: { 
                        type: SchemaType.STRING, 
                        description: "The SQLite query to run to explore data (e.g. SELECT DISTINCT payee FROM transactions WHERE payee LIKE '%amazon%' LIMIT 10)" 
                    }
                },
                required: ["sql"]
            }
        };

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: `${buildSchemaDescription(categories)}
You must use the explore_database tool if you need to find out which exact strings or categories exist in the database (e.g. querying payees like 'Amazon' or 'Uber' or specific categories) to fulfill the user's request. 
You can query the database multiple times.
Once you are confident about the exact SQL needed to answer the user's request, YOU MUST construct the final SQL query and return it inside a JSON block with the 'sql' and 'chart' fields. 
CRITICAL RULE: Always alias your columns with clean, Title Case, human-readable labels (e.g. 'Amazon Spend' instead of 'amazon_spend', 'Total Amount' instead of 'sum') unless it's the mandatory 'date', 'label', or 'value' columns required by the charting engine.
Example Final Output:
\`\`\`json
{"sql": "SELECT category AS label, SUM(ABS(amount)) as value FROM transactions WHERE amount < 0 AND category != 'Internal Transfer' GROUP BY category", "chart": "pie"}
\`\`\`
Do not output anything after the final JSON block.`,
            tools: [
                { functionDeclarations: [exploreDatabaseDeclaration] }
            ]
        });

        const chat = model.startChat();
        dbToClose = new Database(dbPath, { readonly: true });
        
        let result = await chat.sendMessage(`User request: ${prompt}\nRemember to explore data first if needed, then output your final JSON answer in a codeblock.`);
        let responseText = result.response.text();

        let attempts = 0;
        const maxAttempts = 5;

        // Loop while the model wants to call tools
        while (result.response.functionCalls() && result.response.functionCalls()!.length > 0 && attempts < maxAttempts) {
            attempts++;
            const calls = result.response.functionCalls()!;
            const call = calls[0]; // Just handle one at a time

            if (call.name === "explore_database") {
                const queryArgs = call.args as { sql: string };
                let resultData: any;
                try {
                    const unsafe = /(;|\b)(insert|update|delete|drop|alter|create|attach|detach|replace|pragma|vacuum)\b/i;
                    if (unsafe.test(queryArgs.sql)) {
                        throw new Error('Unsafe SQL detected during exploration');
                    }
                    const rows = dbToClose.prepare(queryArgs.sql).all();
                    resultData = { rows: rows.slice(0, 50) }; // cap at 50 to avoid huge context
                } catch (e: any) {
                    resultData = { error: e.message };
                }

                result = await chat.sendMessage([{
                    functionResponse: {
                        name: "explore_database",
                        response: resultData
                    }
                }]);
                responseText = result.response.text();
            } else {
                break; // Unknown tool
            }
        }

        let parsed: ModelResponse | null = null;
        try {
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            }
        } catch (_) {
            parsed = null;
        }

        if (!parsed || typeof parsed.sql !== 'string' || (parsed.chart !== 'cumulative' && parsed.chart !== 'pie' && parsed.chart !== 'area' && parsed.chart !== 'bar')) {
            if (dbToClose) dbToClose.close();
            return new Response(JSON.stringify({ error: 'Invalid model response format', raw: responseText }), { status: 502 });
        }

        const unsafe = /(;|\b)(insert|update|delete|drop|alter|create|attach|detach|replace|pragma|vacuum)\b/i;
        if (unsafe.test(parsed.sql)) {
            if (dbToClose) dbToClose.close();
            return new Response(JSON.stringify({ error: 'Unsafe final SQL detected' }), { status: 400 });
        }

        let rows: any[] = [];
        try {
            rows = dbToClose.prepare(parsed.sql).all();
        } finally {
            if (dbToClose) dbToClose.close();
            dbToClose = null;
        }

        return new Response(JSON.stringify({ chart: parsed.chart, rows, sql: parsed.sql }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        if (dbToClose) {
            try { dbToClose.close(); } catch (_) {}
        }
        console.error(err);
        return new Response(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500 });
    }
}
