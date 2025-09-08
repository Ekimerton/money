import { NextRequest } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ChartType = 'cumulative' | 'pie';

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

const schemaDescription = `
You are helping generate SQLite SQL for a personal finance app. Use only these tables/columns:

Table transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  posted INTEGER,            -- unix seconds
  amount TEXT,               -- signed string; expenses are negative
  description TEXT,
  payee TEXT NULL,
  transacted_at INTEGER,     -- unix seconds
  pending INTEGER,           -- 0/1
  hidden INTEGER,            -- 0/1
  category TEXT              -- includes 'Internal Transfer'
);

Rules:
- Always filter out hidden = 1 and category = 'Internal Transfer'.
- For spend analyses, use amount < 0 and ABS(CAST(amount AS REAL)) for magnitude.
- If grouping by date, convert transacted_at (seconds) to days using DATE(transacted_at, 'unixepoch').
- ONLY return SQLite-compatible SQL. No comments. No backticks.
- Limit to reasonable rows when returning time series (e.g., don't group by too granularly without a date).

Chart types allowed:
- cumulative: for cumulative spending over time (line/area series). Provide date and series columns.
- pie: for composition breakdown (category share) at a chosen scope.
`;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const prompt: string = String(body?.prompt || '').trim();
        if (!prompt) {
            return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
        }

        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `${schemaDescription}\nUser request: ${prompt}\nReturn a strict JSON with keys sql and chart where chart is one of [cumulative, pie].`;

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

        if (!parsed || typeof parsed.sql !== 'string' || (parsed.chart !== 'cumulative' && parsed.chart !== 'pie')) {
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


