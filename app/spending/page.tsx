import SpendingPageClient from "@/app/spending/spending-page";
import { Account, Transaction } from "@/lib/types";

export default async function SpendingPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const transactionsUrl = accountId ? `http://localhost:3000/api/get-transactions?accountId=${encodeURIComponent(accountId)}` : 'http://localhost:3000/api/get-transactions';
    const transactionsResponse = await fetch(transactionsUrl, {
        next: {
            tags: ['accounts', 'transactions']
        }
    });
    if (!transactionsResponse.ok) {
        throw new Error(`Error: ${transactionsResponse.status}`);
    }
    const transactionsData = await transactionsResponse.json();
    const transactions: Transaction[] = transactionsData.transactions;

    const accountsResponse = await fetch('http://localhost:3000/api/get-accounts', {
        next: {
            tags: ['accounts', 'transactions']
        }
    });
    if (!accountsResponse.ok) {
        throw new Error(`Error: ${accountsResponse.status}`);
    }
    const accountsData = await accountsResponse.json();
    const accounts: Account[] = accountsData.accounts;

    return (
        <SpendingPageClient
            transactions={transactions}
            accounts={accounts}
        />
    );
}


