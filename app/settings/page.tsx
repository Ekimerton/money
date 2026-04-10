import SettingsClient from "@/app/settings/settings-client";
import Database from 'better-sqlite3';
import path from 'path';
import { unstable_cache } from 'next/cache';
import { getSettings } from "@/lib/settings";

const getSettingsData = unstable_cache(async () => {
    const dbPath = path.join(process.cwd(), './data/user_data.db');
    const db = new Database(dbPath);
    try {
        const userConfig = db
            .prepare('SELECT simplefin_url FROM user_config WHERE id = 1')
            .get() as any;
        
        const settings = await getSettings();

        return {
            display_name: settings.displayName || null,
            simplefin_url: userConfig?.simplefin_url || null,
            classifier_training_date: settings.classifierTrainingDate || null,
            auto_categorize: settings.autoCategorize ? 1 : 0,
            auto_mark_duplicates: settings.autoMarkDuplicates ? 1 : 0,
            auto_refresh_daily: settings.autoRefreshDaily ? 1 : 0,
        };
    } finally {
        db.close();
    }
}, ["settings-v1"], { tags: ["settings"] });

export default async function SettingsPage() {
    const userConfig = await getSettingsData();
    return (
        <div>
            <SettingsClient
                initialDisplayName={userConfig?.display_name || ''}
                initialClassifierTrainingDate={userConfig?.classifier_training_date}
                initialAutoCategorize={Boolean(userConfig?.auto_categorize)}
                initialMarkDuplicates={Boolean(userConfig?.auto_mark_duplicates)}
                initialAutoRefreshDaily={Boolean(userConfig?.auto_refresh_daily)}
            />
        </div>
    );
}


