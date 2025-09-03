import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET(_req: NextRequest) {
    try {
        const dbPath = path.join(process.cwd(), './data/user_data.db');
        const db = new Database(dbPath);
        const row = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category = 'Uncategorized' AND hidden = 0").get() as any;
        db.close();
        return NextResponse.json({ count: Number(row?.count ?? 0) });
    } catch (error: any) {
        console.error('Error fetching uncategorized count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


