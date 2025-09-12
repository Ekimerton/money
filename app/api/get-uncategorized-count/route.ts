import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { unstable_cache as cache } from 'next/cache';

export async function GET(_req: NextRequest) {
    try {
        const getCount = cache(async () => {
            const dbPath = path.join(process.cwd(), './data/user_data.db');
            const db = new Database(dbPath);
            try {
                const row = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category = 'Uncategorized' AND hidden = 0").get() as any;
                return Number(row?.count ?? 0);
            } finally {
                db.close();
            }
        }, ['uncategorized-count'], { tags: ['transactions'] });

        const count = await getCount();
        return NextResponse.json({ count });
    } catch (error: any) {
        console.error('Error fetching uncategorized count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


