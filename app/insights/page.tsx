import InsightsClient from "@/app/insights/insights-client";

export default async function InsightsPage() {
    return (
        <div className="h-full max-h-screen">
            <InsightsClient />
        </div>
    );
}


