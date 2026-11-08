import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getDataPath } from '@/lib/paths';

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
    try {
        const dbPath = getDataPath('user_data.db');
        const db = new Database(dbPath);
        try {
            const row = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category = 'Uncategorized' AND hidden = 0").get() as any;
            const count = Number(row?.count ?? 0);
            return NextResponse.json({ count });
        } finally {
            db.close();
        }
    } catch (error: any) {
        console.error('Error fetching uncategorized count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


