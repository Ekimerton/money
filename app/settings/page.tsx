import SettingsClient from "@/app/settings/settings-client";

export default async function SettingsPage() {
    const configResponse = await fetch('http://localhost:3000/api/get-user-config', {
        next: {
            tags: ['user-config']
        }
    });
    if (!configResponse.ok) {
        throw new Error(`Error: ${configResponse.status}`);
    }
    const configData = await configResponse.json();
    const userConfig = configData.userConfig as {
        display_name: string | null;
        simplefin_url: string | null;
        classifier_training_date: string | null;
        auto_categorize: boolean;
        auto_mark_duplicates?: boolean;
    };

    return (
        <div className="p-4">
            <SettingsClient
                initialDisplayName={userConfig.display_name || ''}
                initialClassifierTrainingDate={userConfig.classifier_training_date}
                initialAutoCategorize={userConfig.auto_categorize || false}
                initialMarkDuplicates={userConfig.auto_mark_duplicates || false}
            />
        </div>
    );
}


