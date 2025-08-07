import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function GET() {
    try {
        const db = new Database(dbPath);
        const userConfig = db.prepare('SELECT simplefin_url, classifier_training_date, name FROM user_config').get();
        db.close();

        return NextResponse.json({ userConfig }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching user config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}