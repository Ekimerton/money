import SpendingPageClient from "@/app/spending/spending-page";
import { getTransactionsCached, getAccountsCached } from "@/lib/data-helpers";

export default async function SpendingPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const transactions = await getTransactionsCached(accountId);
    const accounts = await getAccountsCached();

    return (
        <SpendingPageClient
            transactions={transactions}
            accounts={accounts}
        />
    );
}
