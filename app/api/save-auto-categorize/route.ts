import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { revalidateTag } from 'next/cache';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const { autoCategorize } = await req.json();

        if (typeof autoCategorize !== 'boolean') {
            return NextResponse.json({ error: 'autoCategorize must be a boolean.' }, { status: 400 });
        }

        const db = new Database(dbPath);

        const stmt = db.prepare(`
            INSERT INTO user_config (id, auto_categorize)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                auto_categorize = excluded.auto_categorize
        `);
        stmt.run(autoCategorize ? 1 : 0);

        db.close();

        revalidateTag('settings');
        return NextResponse.json({ message: 'Auto categorize setting saved successfully!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving auto categorize setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
