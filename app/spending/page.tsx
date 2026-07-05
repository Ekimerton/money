import SpendingPageClient from "@/app/spending/spending-page";
import { getTransactions, getAccounts } from "@/lib/data";

export default async function SpendingPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const transactions = await getTransactions(accountId);
    const accounts = await getAccounts();

    return (
        <SpendingPageClient
            transactions={transactions}
            accounts={accounts}
        />
    );
}