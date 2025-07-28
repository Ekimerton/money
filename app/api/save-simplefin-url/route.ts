import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(req: NextRequest) {
    try {
        const { SETUP_TOKEN } = await req.json();

        if (!SETUP_TOKEN) {
            return NextResponse.json({ error: 'SETUP_TOKEN is required.' }, { status: 400 });
        }

        const CLAIM_URL = Buffer.from(SETUP_TOKEN, 'base64').toString('utf-8');

        const claimResponse = await fetch(CLAIM_URL, {
            method: 'POST',
            headers: {
                'Content-Length': '0',
            },
        });

        if (!claimResponse.ok) {
            throw new Error(`Failed to claim URL: ${claimResponse.statusText}`);
        }

        const ACCESS_URL = await claimResponse.text();

        const db = new Database(dbPath);
        const stmt = db.prepare(`
            INSERT INTO user_config (name, simplefin_url)
            VALUES (?, ?)
            ON CONFLICT(name) DO UPDATE SET
                simplefin_url=excluded.simplefin_url;
        `);
        stmt.run('simplefin_url', ACCESS_URL);
        db.close();

        return NextResponse.json({ message: 'SimpleFIN URL saved successfully!', simplefinUrl: ACCESS_URL }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving SimpleFIN URL:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 