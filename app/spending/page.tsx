import SpendingPageClient from "@/app/spending/spending-page";
import { Account, Transaction } from "@/lib/types";

export default async function SpendingPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const { getTransactionsData, getAccountsData } = await import("@/lib/data");
    const transactions: Transaction[] = getTransactionsData(accountId);
    const accounts: Account[] = getAccountsData();

    return (
        <SpendingPageClient
            transactions={transactions}
            accounts={accounts}
        />
    );
}


