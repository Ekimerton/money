import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(_req: NextRequest) {
    try {
        const db = getDb();
        db.exec('DROP TABLE IF EXISTS user_config;');
        /* db.close removed */

        return NextResponse.json({ message: 'user_config table deleted.' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting user_config table:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

