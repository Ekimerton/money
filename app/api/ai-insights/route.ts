import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import fs from 'fs';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType, Content } from '@google/generative-ai';
import { getDataPath } from '@/lib/paths';
import {
    getInsightThreads,
    upsertInsightThread,
    deleteInsightThread,
    InsightThread,
} from '@/lib/settings';

export type ChartType = 'cumulative' | 'pie' | 'area' | 'bar';

export interface ChartPayload {
    id: string;
    title: string;
    subtitle?: string;
    chart: ChartType;
    sql: string;
    rows: any[];
}

interface IncomingChartContext {
    title?: string;
    subtitle?: string;
    chart: ChartType;
    sql: string;
}

interface IncomingMessage {
    role: 'user' | 'assistant';
    content: string;
    charts?: IncomingChartContext[];
}

const dbPath = getDataPath('user_data.db');

const UNSAFE_SQL_REGEX = /(;|\b)(insert|update|delete|drop|alter|create|attach|detach|replace|pragma|vacuum)\b/i;

function getGeminiClient() {
    const settingsPath = getDataPath('user-settings.json');
    let apiKey = '';
    try {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        const parsed = JSON.parse(raw);
        apiKey = String(parsed?.geminiApiKey || '').trim();
    } catch (_) {
        // fall through to error below
    }
    if (!apiKey && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY.trim();
    }
    if (!apiKey) {
        throw new Error('Missing Gemini API key. Please add your Gemini API key in Settings or data/user-settings.json.');
    }
    return new GoogleGenerativeAI(apiKey);
}

function buildSystemInstruction(context: {
    categories: string[];
    accounts: Array<{ name: string; type: string; currency: string; balance: string }>;
    minDate: string | null;
    maxDate: string | null;
    totalTransactions: number;
    todayDate: string;
}): string {
    const categoriesSection = context.categories.length
        ? `\nDistinct transaction categories present in DB (case-sensitive; always exclude 'Internal Transfer' for spending):\n${context.categories
              .map((c) => `- ${c}`)
              .join('\n')}\n`
        : '';

    const accountsSection = context.accounts.length
        ? `\nUser accounts currently in DB:\n${context.accounts
              .map((a) => `- ${a.name} (type: ${a.type}, balance: ${a.balance} ${a.currency})`)
              .join('\n')}\n`
        : '';

    const dateRangeInfo =
        context.minDate && context.maxDate
            ? `Transactions date range in DB: ${context.minDate} to ${context.maxDate} (${context.totalTransactions} total non-hidden transactions).`
            : `Total non-hidden transactions: ${context.totalTransactions}.`;

    return `You are Gemini Financial Insights, an intelligent, conversational personal finance analyst built into the user's Money App.
Today's date is ${context.todayDate}.
${dateRangeInfo}
${accountsSection}${categoriesSection}

Database schema (SQLite) - use ONLY these tables and columns:

1. Table accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance TEXT NOT NULL,           -- signed string amount
  balance_date INTEGER NOT NULL,   -- unix seconds
  type TEXT DEFAULT 'uncategorized' -- e.g. 'checking', 'savings', 'credit', 'investment', 'loan'
);

2. Table account_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT NOT NULL,
  balance TEXT NOT NULL,           -- signed string amount
  balance_date INTEGER NOT NULL,   -- unix seconds
  fetched_at TEXT NOT NULL         -- ISO timestamp string
);

3. Table transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  posted INTEGER,                  -- unix seconds
  amount TEXT,                     -- signed string; expenses are negative (< 0), income/refunds are positive (> 0)
  description TEXT,                -- raw bank description; useful alongside payee
  payee TEXT NULL,                 -- cleaned merchant/payee name
  transacted_at INTEGER,           -- unix seconds (USE THIS for transaction dates)
  pending INTEGER,                 -- 0 or 1
  hidden INTEGER,                  -- 0 or 1
  category TEXT                    -- category name; includes 'Internal Transfer'
);

SQL & Financial Data Rules:
- Always filter out hidden transactions (\`hidden = 0\`) and internal transfers (\`category != 'Internal Transfer'\` or \` COALESCE(category, '') != 'Internal Transfer'\`).
- Expenses have \`CAST(amount AS REAL) < 0\`. When calculating spending totals or charting spend, filter with \`CAST(amount AS REAL) < 0\` and use \`ROUND(SUM(ABS(CAST(amount AS REAL))), 2)\` for positive magnitude.
- When searching for a merchant/payee (e.g. Amazon, Uber, Target), check BOTH \`payee\` and \`description\` case-insensitively: \`(LOWER(COALESCE(payee, '')) LIKE '%amazon%' OR LOWER(COALESCE(description, '')) LIKE '%amazon%')\`.
- Convert \`transacted_at\` (unix seconds) to dates using \`DATE(transacted_at, 'unixepoch')\` for daily dates or \`STRFTIME('%Y-%m-01', transacted_at, 'unixepoch')\` for monthly buckets.
- Only run read-only SQLite SELECT queries.

How to Respond (Text + Embedded Charts + Follow-ups):
- You can reply with rich, helpful Markdown text, embedded interactive charts (by calling the \`render_chart\` tool), or BOTH!
- Use \`explore_database\` first whenever you need to verify merchant names, check specific transactions, or get exact numbers for a text-only question.
- Call \`render_chart\` whenever a visual chart helps illustrate the answer (e.g., trends over time, category breakdowns, merchant comparisons, cumulative spend, net worth / balance history). You can even call \`render_chart\` multiple times if comparing two different views!
- Even when you call \`render_chart\`, ALWAYS provide a concise, insightful natural-language Markdown response summarizing the key takeaways, notable numbers, averages, or spikes so the user gets both visual and written analysis.
- Do NOT dump raw JSON blocks for charts in your text response—use the \`render_chart\` tool to embed charts.

Chart Types & Column Naming Rules for \`render_chart\`:
- \`bar\`: Best for categorical comparisons (e.g., top merchants, category totals) AND discrete time-series (e.g., monthly or daily spend).
  - For categorical bar charts: return \`label\` and \`value\` columns (e.g., \`SELECT category AS label, ROUND(SUM(ABS(CAST(amount AS REAL))), 2) AS value ...\`).
  - For single-series time-series bar charts: return \`date\` and a human-readable Title Case value column (e.g., \`SELECT STRFTIME('%Y-%m-01', transacted_at, 'unixepoch') AS date, ROUND(SUM(ABS(CAST(amount AS REAL))), 2) AS "Monthly Spend" ...\`).
  - For multi-series time-series bar charts: either return wide columns (\`date\`, \`"Dining Out"\`, \`"Groceries"\`) using \`SUM(CASE WHEN ...)\` OR return \`date\`, \`series\` (or \`category\`), and \`value\`—the UI automatically pivots 3-column \`(date, series, value)\` data!
- \`pie\`: Best for composition/percentage breakdowns (e.g., spending by category). Return \`label\` and \`value\` columns.
- \`area\`: Best for continuous time-series trends (e.g., account balance history or spending trends over many data points). Return \`date\` and one or more value columns (or \`date\`, \`series\`, \`value\`).
- \`cumulative\`: Use when the user asks for cumulative spend, running total, or growth over time. Return \`date\` and cumulative value column(s) (or daily values to be stacked/accumulated).

Follow-Up Suggestions:
- At the very end of your final Markdown response, include 2 to 3 short, natural follow-up questions the user can click next, wrapped in a \`<followups>\` tag containing a JSON string array.
- Example:
  \`<followups>["Break this down by month", "Which individual transactions were the largest?", "Compare this to the previous 3 months"]</followups>\`
`;
}

function extractFollowUpsAndCleanText(rawText: string): {
    cleanText: string;
    followUps: string[];
} {
    let cleanText = rawText;
    let followUps: string[] = [];

    const followUpMatch = cleanText.match(/<followups>\s*([\s\S]*?)\s*<\/followups>/i);
    if (followUpMatch) {
        cleanText = cleanText.replace(followUpMatch[0], '').trim();
        try {
            const parsed = JSON.parse(followUpMatch[1]);
            if (Array.isArray(parsed)) {
                followUps = parsed.map((item) => String(item).trim()).filter(Boolean).slice(0, 4);
            }
        } catch (_) {
            // fallback line split if not valid JSON
            followUps = followUpMatch[1]
                .split('\n')
                .map((s) => s.replace(/^[-*\d.)\s"']+|["',\s]+$/g, '').trim())
                .filter(Boolean)
                .slice(0, 3);
        }
    }

    return { cleanText, followUps };
}

export async function GET() {
    try {
        const threads = await getInsightThreads();
        return NextResponse.json({ threads });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed to load previous queries' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const action = body?.action;

        if (action === 'save_thread') {
            const thread = body?.thread as InsightThread;
            if (!thread || !thread.id || !thread.firstPrompt) {
                return NextResponse.json({ error: 'Invalid thread payload' }, { status: 400 });
            }
            const threads = await upsertInsightThread(thread);
            return NextResponse.json({ threads });
        }

        if (action === 'delete_thread') {
            const id = String(body?.id || '');
            const threads = await deleteInsightThread(id);
            return NextResponse.json({ threads });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Failed to update previous queries' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    let dbToClose: Database.Database | null = null;
    try {
        const body = await req.json();

        // Support both multi-turn `messages` array and legacy single `prompt`
        const rawMessages: IncomingMessage[] = Array.isArray(body?.messages) ? body.messages : [];
        const singlePrompt = String(body?.prompt || '').trim();

        if (rawMessages.length === 0 && singlePrompt) {
            rawMessages.push({ role: 'user', content: singlePrompt });
        }

        if (rawMessages.length === 0) {
            return NextResponse.json({ error: 'Missing prompt or messages' }, { status: 400 });
        }

        const latestUserMessage = rawMessages[rawMessages.length - 1];
        if (!latestUserMessage || !latestUserMessage.content?.trim()) {
            return NextResponse.json({ error: 'Empty user message' }, { status: 400 });
        }

        // Gather database context
        let categories: string[] = [];
        let accounts: Array<{ name: string; type: string; currency: string; balance: string }> = [];
        let minDate: string | null = null;
        let maxDate: string | null = null;
        let totalTransactions = 0;

        dbToClose = new Database(dbPath, { readonly: true });

        try {
            const catRows = dbToClose
                .prepare(
                    "SELECT DISTINCT category AS category FROM transactions WHERE hidden = 0 AND category IS NOT NULL AND TRIM(category) <> '' AND category <> 'Internal Transfer' ORDER BY category ASC"
                )
                .all() as Array<{ category: string }>;
            categories = catRows.map((r) => r.category);

            accounts = dbToClose
                .prepare('SELECT name, type, currency, balance FROM accounts ORDER BY name ASC')
                .all() as Array<{ name: string; type: string; currency: string; balance: string }>;

            const statsRow = dbToClose
                .prepare(
                    "SELECT MIN(DATE(transacted_at, 'unixepoch')) as minDate, MAX(DATE(transacted_at, 'unixepoch')) as maxDate, COUNT(*) as cnt FROM transactions WHERE hidden = 0"
                )
                .get() as { minDate: string | null; maxDate: string | null; cnt: number } | undefined;

            if (statsRow) {
                minDate = statsRow.minDate;
                maxDate = statsRow.maxDate;
                totalTransactions = Number(statsRow.cnt || 0);
            }
        } catch (_) {
            // Proceed even if some metadata queries fail
        }

        const genAI = getGeminiClient();

        const exploreDatabaseDeclaration: FunctionDeclaration = {
            name: 'explore_database',
            description:
                'Run a read-only SQLite SELECT query to explore the database, check exact payee/description/category values, inspect specific transactions, or compute numbers to answer the user in text. Returns up to 50 rows.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    sql: {
                        type: SchemaType.STRING,
                        description:
                            "The SQLite SELECT query to run (e.g., SELECT payee, amount, DATE(transacted_at, 'unixepoch') as date FROM transactions WHERE hidden = 0 LIMIT 20)",
                    },
                },
                required: ['sql'],
            },
        };

        const renderChartDeclaration: FunctionDeclaration = {
            name: 'render_chart',
            description:
                'Execute a read-only SQLite SELECT query and embed an interactive chart in your response to the user. Use this whenever a visual graph (bar, pie, area, cumulative) adds value to your answer.',
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    title: {
                        type: SchemaType.STRING,
                        description: 'Clean, descriptive title for the chart (e.g. "Monthly Amazon Spending", "Top Spending Categories")',
                    },
                    subtitle: {
                        type: SchemaType.STRING,
                        description: 'Optional short subtitle or time range description (e.g. "Last 6 Months", "Jan 2026 – Oct 2026")',
                    },
                    chart: {
                        type: SchemaType.STRING,
                        description: "The chart type: 'bar', 'pie', 'area', or 'cumulative'",
                        enum: ['bar', 'pie', 'area', 'cumulative'],
                        format: 'enum',
                    },
                    sql: {
                        type: SchemaType.STRING,
                        description:
                            "The SQLite SELECT query that produces the chart data. Follow column naming rules: 'date' for time series, 'label' and 'value' for categorical bar/pie charts.",
                    },
                },
                required: ['title', 'chart', 'sql'],
            },
        };

        const todayDate = new Date().toISOString().split('T')[0];
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: buildSystemInstruction({
                categories,
                accounts,
                minDate,
                maxDate,
                totalTransactions,
                todayDate,
            }),
            tools: [{ functionDeclarations: [exploreDatabaseDeclaration, renderChartDeclaration] }],
        });

        // Build multi-turn history for Gemini chat
        const history: Content[] = [];
        const priorMessages = rawMessages.slice(0, -1);
        for (const msg of priorMessages) {
            const role = msg.role === 'assistant' ? 'model' : 'user';
            let textContent = String(msg.content || '').trim();
            if (msg.role === 'assistant' && Array.isArray(msg.charts) && msg.charts.length > 0) {
                const chartContextNotes = msg.charts
                    .map((c) => `[Embedded Chart "${c.title || c.chart}" (${c.chart}) SQL: ${c.sql}]`)
                    .join('\n');
                textContent = `${textContent}\n\n${chartContextNotes}`.trim();
            }
            if (!textContent) continue;

            // Ensure alternating roles starting with 'user'
            if (history.length === 0 && role !== 'user') continue;
            if (history.length > 0 && history[history.length - 1].role === role) {
                history[history.length - 1].parts[0].text += `\n\n${textContent}`;
            } else {
                history.push({
                    role,
                    parts: [{ text: textContent }],
                });
            }
        }

        const chat = model.startChat({ history });

        const generatedCharts: ChartPayload[] = [];
        const hintSql = body?.hintSql ? String(body.hintSql).trim() : '';
        const hintChart = body?.hintChart as ChartType | undefined;

        let userPromptToSend = latestUserMessage.content.trim();
        if (hintSql) {
            userPromptToSend += `\n\n[Note: This is a saved query. You may use or adapt this SQL with render_chart (chart="${hintChart || 'bar'}"): ${hintSql}]`;
        }

        let result = await chat.sendMessage(userPromptToSend);
        let attempts = 0;
        const maxAttempts = 8;

        while (
            result.response.functionCalls() &&
            result.response.functionCalls()!.length > 0 &&
            attempts < maxAttempts
        ) {
            attempts++;
            const calls = result.response.functionCalls()!;
            const functionResponses: any[] = [];

            for (const call of calls) {
                if (call.name === 'explore_database') {
                    const queryArgs = call.args as { sql: string };
                    let resultData: any;
                    try {
                        const sql = String(queryArgs?.sql || '').trim().replace(/;+\s*$/, '');
                        if (UNSAFE_SQL_REGEX.test(sql)) {
                            throw new Error('Unsafe SQL detected during exploration. Only read-only SELECT queries are allowed.');
                        }
                        const rows = dbToClose.prepare(sql).all();
                        resultData = {
                            totalRows: rows.length,
                            rows: rows.slice(0, 50),
                        };
                    } catch (e: any) {
                        resultData = { error: e.message };
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: 'explore_database',
                            response: resultData,
                        },
                    });
                } else if (call.name === 'render_chart') {
                    const chartArgs = call.args as {
                        title?: string;
                        subtitle?: string;
                        chart?: ChartType;
                        sql?: string;
                    };
                    let resultData: any;
                    try {
                        const sql = String(chartArgs?.sql || '').trim().replace(/;+\s*$/, '');
                        const chartType: ChartType =
                            chartArgs?.chart && ['bar', 'pie', 'area', 'cumulative'].includes(chartArgs.chart)
                                ? chartArgs.chart
                                : 'bar';
                        const title = String(chartArgs?.title || 'Financial Insight').trim();
                        const subtitle = chartArgs?.subtitle ? String(chartArgs.subtitle).trim() : undefined;

                        if (!sql) {
                            throw new Error('Missing SQL query for render_chart');
                        }
                        if (UNSAFE_SQL_REGEX.test(sql)) {
                            throw new Error('Unsafe SQL detected. Only read-only SELECT queries are allowed.');
                        }

                        const rows = dbToClose.prepare(sql).all();
                        if (rows.length === 0) {
                            resultData = {
                                success: false,
                                rowCount: 0,
                                warning:
                                    'Query returned 0 rows. The chart was not rendered. Use explore_database to inspect actual category/payee names or date ranges and try again if appropriate.',
                            };
                        } else {
                            const chartPayload: ChartPayload = {
                                id: `chart_${Date.now()}_${generatedCharts.length}`,
                                title,
                                subtitle,
                                chart: chartType,
                                sql,
                                rows,
                            };
                            generatedCharts.push(chartPayload);
                            resultData = {
                                success: true,
                                rowCount: rows.length,
                                sampleRows: rows.slice(0, 25),
                                note: 'Chart successfully attached to the UI response. Now write your concise Markdown summary and <followups> suggestions.',
                            };
                        }
                    } catch (e: any) {
                        resultData = {
                            success: false,
                            error: e.message,
                        };
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: 'render_chart',
                            response: resultData,
                        },
                    });
                } else {
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: `Unknown tool ${call.name}` },
                        },
                    });
                }
            }

            result = await chat.sendMessage(functionResponses);
        }

        let responseText = '';
        try {
            responseText = result.response.text() || '';
        } catch (_) {
            responseText = '';
        }

        // Legacy fallback: if the model output a JSON codeblock {"sql": "...", "chart": "..."} instead of calling render_chart
        if (generatedCharts.length === 0 && responseText) {
            const jsonBlockMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?"sql"[\s\S]*?\})\s*```/i) ||
                responseText.match(/(\{\s*"sql"\s*:[\s\S]*?"chart"\s*:[\s\S]*?\})/);
            if (jsonBlockMatch) {
                try {
                    const parsed = JSON.parse(jsonBlockMatch[1]);
                    if (
                        parsed &&
                        typeof parsed.sql === 'string' &&
                        ['bar', 'pie', 'area', 'cumulative'].includes(parsed.chart) &&
                        !UNSAFE_SQL_REGEX.test(parsed.sql)
                    ) {
                        const rows = dbToClose.prepare(parsed.sql).all();
                        if (rows.length > 0) {
                            generatedCharts.push({
                                id: `chart_${Date.now()}_0`,
                                title: parsed.title || 'Spending Insight',
                                subtitle: parsed.subtitle,
                                chart: parsed.chart,
                                sql: parsed.sql,
                                rows,
                            });
                        }
                        responseText = responseText.replace(jsonBlockMatch[0], '').trim();
                    }
                } catch (_) {
                    // ignore fallback parse error
                }
            }
        }

        dbToClose.close();
        dbToClose = null;

        const { cleanText, followUps } = extractFollowUpsAndCleanText(responseText);

        const finalText =
            cleanText ||
            (generatedCharts.length > 0
                ? `Here ${generatedCharts.length === 1 ? 'is the chart' : 'are the charts'} for **${generatedCharts.map((c) => c.title).join(' & ')}**.`
                : "I couldn't find matching data for that request. Try asking about a different category, merchant, or time range.");

        const primaryChart = generatedCharts[0] || null;

        return NextResponse.json({
            text: finalText,
            charts: generatedCharts,
            followUps:
                followUps.length > 0
                    ? followUps
                    : [
                          'Break this down by category',
                          'How does this compare to last month?',
                          'What were the largest individual transactions?',
                      ],
            // Legacy top-level fields for compatibility
            chart: primaryChart?.chart,
            rows: primaryChart?.rows || [],
            sql: primaryChart?.sql || '',
        });
    } catch (err: any) {
        if (dbToClose) {
            try {
                dbToClose.close();
            } catch (_) {}
        }
        console.error('Error in /api/ai-insights:', err);
        return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
    }
}
