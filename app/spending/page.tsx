import SpendingPageClient from "@/app/spending/spending-page";
import { Account, Transaction } from "@/lib/types";

export default async function SpendingPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const { getTransactions, getAccounts } = await import('@/lib/data');

    const transactions = getTransactions(accountId);
    const accounts = getAccounts();

    return (
        <SpendingPageClient
            transactions={transactions}
            accounts={accounts}
        />
    );
}


