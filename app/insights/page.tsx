import InsightsClient from "@/app/insights/insights-client";
import { getSettings, getInsightThreads } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
    const [settings, threads] = await Promise.all([
        getSettings(),
        getInsightThreads(),
    ]);
    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            <InsightsClient
                initialDisplayName={settings.displayName || ""}
                initialThreads={threads}
            />
        </div>
    );
}
