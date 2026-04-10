import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

import { getSettings } from '@/lib/settings';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function GET() {
    try {
        const db = new Database(dbPath);
        const simplefinRow = db
            .prepare('SELECT simplefin_url FROM user_config WHERE id = 1')
            .get() as any;
        db.close();

        const settings = await getSettings();

        const userConfig = {
            display_name: settings.displayName || null,
            simplefin_url: simplefinRow?.simplefin_url || null,
            classifier_training_date: settings.classifierTrainingDate || null,
            auto_categorize: settings.autoCategorize || false,
            auto_mark_duplicates: settings.autoMarkDuplicates || false,
            onboarding_completed: settings.onboardingCompleted || false,
            auto_refresh_daily: settings.autoRefreshDaily || false,
        };

        return NextResponse.json({ userConfig }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching user config:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}