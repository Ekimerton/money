import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { getDataPath } from '@/lib/paths';

const dbPath = getDataPath('user_data.db');

import { updateSettings } from '@/lib/settings';

export async function POST(_req: NextRequest) {
    try {
        const db = new Database(dbPath);
        db.exec('DROP TABLE IF EXISTS user_config;');
        db.close();

        await updateSettings({
            displayName: undefined,
            classifierTrainingDate: null,
            autoCategorize: false,
            autoMarkDuplicates: false,
            onboardingCompleted: false,
            autoRefreshDaily: false
        });

        return NextResponse.json({ message: 'User configuration deleted successfully.' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting user_config table:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

