import { Account, Transaction } from "@/lib/types";
import { TransactionsTableClient } from "@/components/transactions-table-client";

export default async function TransactionsTablePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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

    const categoriesResponse = await fetch('http://localhost:3000/api/get-categories', {
        next: {
            tags: ['accounts', 'transactions']
        }
    });
    if (!categoriesResponse.ok) {
        throw new Error(`Error fetching categories: ${categoriesResponse.status}`);
    }
    const categoriesData = await categoriesResponse.json();
    const existingCategories: string[] = categoriesData.categories;

    return (
        <TransactionsTableClient
            initialTransactions={transactions}
            initialAccounts={accounts}
            initialCategories={existingCategories}
            timeRange={"90d"}
        />
    );
}