import SettingsClient from "@/app/settings/settings-client";
import { unstable_cache } from 'next/cache';
import { getSettings } from "@/lib/settings";

const getSettingsData = unstable_cache(async () => {
    try {
        const settings = await getSettings();

        return {
            display_name: settings.displayName || null,
            simplefin_url: settings.simplefinUrl || null,
            classifier_training_date: settings.classifierTrainingDate || null,
            auto_categorize: settings.autoCategorize ? 1 : 0,
            auto_mark_duplicates: settings.autoMarkDuplicates ? 1 : 0,
            auto_refresh_daily: settings.autoRefreshDaily ? 1 : 0,
        };
    } catch (error) {
        console.error('Error in getSettingsData:', error);
        return {
            display_name: null,
            simplefin_url: null,
            classifier_training_date: null,
            auto_categorize: 0,
            auto_mark_duplicates: 0,
            auto_refresh_daily: 0,
        };
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
