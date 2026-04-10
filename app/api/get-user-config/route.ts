import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export async function GET() {
    try {
        const settings = await getSettings();

        const userConfig = {
            display_name: settings.displayName || null,
            simplefin_url: settings.simplefinUrl || null,
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