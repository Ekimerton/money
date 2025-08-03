import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function GET(req: NextRequest) {
    try {
        const db = new Database(dbPath);
        const categories = db.prepare('SELECT DISTINCT category FROM transactions').all().map((row: any) => row.category);
        db.close();
        return NextResponse.json({ categories });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 