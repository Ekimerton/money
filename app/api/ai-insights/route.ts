import { NextRequest } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

Chart types allowed:
- cumulative: cumulative spending over time (stacked area). Provide date and series columns.
- area: non-cumulative time series (area lines). Provide date and series columns.
- bar: stacked bar chart. For time series, return one row per day with a column named 'date' (DATE(transacted_at,'unixepoch')) and one or more series columns (e.g., categories). For categorical (no date), return two columns: 'label' and 'value'.
- pie: composition breakdown (category share) at a chosen scope.

Output column naming rules:
- Time series charts (cumulative, area, bar): name the date column exactly 'date' (lowercase) using DATE(transacted_at,'unixepoch').
- Categorical bar and pie charts: return 'label' and 'value' columns (lowercase).
`;
}

export async function POST(req: NextRequest) {
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
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `${buildSchemaDescription(categories)}\nUser request: ${prompt}\nReturn a strict JSON with keys sql and chart where chart is one of [cumulative, area, bar, pie].`;

        const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: systemPrompt }] }] });
        const text = result.response.text();

        let parsed: ModelResponse | null = null;
        try {
            // Attempt to parse the first JSON object found in the text
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                parsed = JSON.parse(match[0]);
            }
        } catch (_) {
            parsed = null;
        }

        if (!parsed || typeof parsed.sql !== 'string' || (parsed.chart !== 'cumulative' && parsed.chart !== 'pie' && parsed.chart !== 'area' && parsed.chart !== 'bar')) {
            return new Response(JSON.stringify({ error: 'Invalid model response', raw: text }), { status: 502 });
        }

        // Basic safety: block writes and dangerous statements
        const unsafe = /(;|\b)(insert|update|delete|drop|alter|create|attach|detach|replace|pragma|vacuum)\b/i;
        if (unsafe.test(parsed.sql)) {
            return new Response(JSON.stringify({ error: 'Unsafe SQL detected' }), { status: 400 });
        }

        const db = new Database(dbPath, { readonly: true });
        let rows: any[] = [];
        try {
            rows = db.prepare(parsed.sql).all();
        } finally {
            db.close();
        }

        return new Response(JSON.stringify({ chart: parsed.chart, rows, sql: parsed.sql }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500 });
    }
}


