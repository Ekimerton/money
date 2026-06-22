import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';




export async function GET() {
    try {
        const db = getDb();
        const userConfig = db
            .prepare(
                'SELECT display_name, simplefin_url, classifier_training_date, auto_categorize, auto_mark_duplicates FROM user_config WHERE id = 1'
            )
            .get() || {
            display_name: null,
            simplefin_url: null,
            classifier_training_date: null,
            auto_categorize: false,
            auto_mark_duplicates: false,
        };
        // // db.close(); // Managed globally

        return NextResponse.json({ userConfig }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching user config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}