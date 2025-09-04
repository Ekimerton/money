import SettingsClient from "@/app/settings/settings-client";
import Database from 'better-sqlite3';
import path from 'path';
import { unstable_cache } from 'next/cache';

const getSettingsData = unstable_cache(async () => {
    const dbPath = path.join(process.cwd(), './data/user_data.db');
    const db = new Database(dbPath);
    try {
        const userConfig = db
            .prepare(
                'SELECT display_name, simplefin_url, classifier_training_date, auto_categorize, auto_mark_duplicates FROM user_config WHERE id = 1'
            )
            .get() as {
                display_name: string | null;
                simplefin_url: string | null;
                classifier_training_date: string | null;
                auto_categorize: boolean | number | null;
                auto_mark_duplicates?: boolean | number | null;
            } || {
            display_name: null,
            simplefin_url: null,
            classifier_training_date: null,
            auto_categorize: 0,
            auto_mark_duplicates: 0,
        };
        return userConfig;
    } finally {
        db.close();
    }
}, ["settings-v1"], { tags: ["settings", "model"] });

export default async function SettingsPage() {
    const userConfig = await getSettingsData();
    return (
        <div>
            <SettingsClient
                initialDisplayName={userConfig?.display_name || ''}
                initialClassifierTrainingDate={userConfig?.classifier_training_date}
                initialAutoCategorize={Boolean(userConfig?.auto_categorize)}
                initialMarkDuplicates={Boolean(userConfig?.auto_mark_duplicates)}
            />
        </div>
    );
}


