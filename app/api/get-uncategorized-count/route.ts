import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';

export async function GET(_req: NextRequest) {
    try {
        const db = getDb();
        const row = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category = 'Uncategorized' AND hidden = 0").get() as any;
        return NextResponse.json({ count: Number(row?.count ?? 0) });
    } catch (error: any) {
        console.error('Error fetching uncategorized count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


