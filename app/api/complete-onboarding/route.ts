import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { revalidateTag } from 'next/cache';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(_req: NextRequest) {
    try {
        const db = new Database(dbPath);
        db.prepare(`
            INSERT INTO user_config (id, onboarding_completed)
            VALUES (1, 1)
            ON CONFLICT(id) DO UPDATE SET onboarding_completed = 1
        `).run();
        db.close();
        revalidateTag('settings');
        return NextResponse.json({ message: 'Onboarding marked complete' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Failed to complete onboarding' }, { status: 500 });
    }
}


