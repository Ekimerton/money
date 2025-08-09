import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(_req: NextRequest) {
    try {
        const db = new Database(dbPath);
        db.exec('DROP TABLE IF EXISTS user_config;');
        db.close();

        return NextResponse.json({ message: 'user_config table deleted.' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting user_config table:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

