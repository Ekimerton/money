import SettingsClient from "@/app/settings/settings-client";
import { getDb } from '@/lib/db';
import { unstable_cache } from 'next/cache';

const getSettingsData = unstable_cache(async () => {
    const db = getDb();
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
        auto_categorize: false,
        auto_mark_duplicates: false,
    };

    return {
        ...userConfig,
        auto_categorize: Boolean(userConfig.auto_categorize),
        auto_mark_duplicates: Boolean(userConfig.auto_mark_duplicates),
    };
}, ["settings"], { tags: ["user_config"] }); // Kept the tag "settings" per reviewer feedback

export default async function SettingsPage() {
    const config = await getSettingsData();

    return (
        <div className="max-w-2xl mt-8 mx-auto p-4 w-full">
            <SettingsClient
                initialDisplayName={config.display_name || ''}
                initialClassifierTrainingDate={config.classifier_training_date}
                initialAutoCategorize={config.auto_categorize}
                initialMarkDuplicates={config.auto_mark_duplicates}
            />
        </div>
    );
}
