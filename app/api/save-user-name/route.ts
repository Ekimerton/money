import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const { userName } = await req.json();
        const db = new Database(dbPath);

        // Update only the display_name for the user_settings row
        const stmt = db.prepare('INSERT OR REPLACE INTO user_config (name, simplefin_url, classifier_training_date, display_name) VALUES ('user_settings', (SELECT simplefin_url FROM user_config WHERE name = 'user_settings'), (SELECT classifier_training_date FROM user_config WHERE name = 'user_settings'), ?)');
        stmt.run(userName);

        db.close();

        return NextResponse.json({ message: 'User name saved successfully!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving user name:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}