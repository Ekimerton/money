import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const { userName } = await req.json();
        if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
            return NextResponse.json({ error: 'userName is required.' }, { status: 400 });
        }
        const db = new Database(dbPath);

        // Upsert display_name on the single-row user_config (id = 1)
        const stmt = db.prepare(`
            INSERT INTO user_config (id, display_name)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                display_name = excluded.display_name
        `);
        stmt.run(userName.trim());

        db.close();

        return NextResponse.json({ message: 'User name saved successfully!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving user name:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}