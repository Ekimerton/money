import TransactionsPageClient from "@/app/transactions/transactions-page-client";
import { Account, Transaction } from "@/lib/types";

export default async function TransactionsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (searchParams.accountId ?? searchParams.account) as string | undefined;

    const transactionsUrl = accountId ? `http://localhost:3000/api/get-transactions?accountId=${encodeURIComponent(accountId)}` : 'http://localhost:3000/api/get-transactions';
    const transactionsResponse = await fetch(transactionsUrl);
    if (!transactionsResponse.ok) {
        throw new Error(`Error: ${transactionsResponse.status}`);
    }
    const transactionsData = await transactionsResponse.json();
    const transactions: Transaction[] = transactionsData.transactions;
    const nonInternalTransactions = transactions.filter(
        (t) => t.category !== 'Internal Transfer'
    );

    const accountsResponse = await fetch('http://localhost:3000/api/get-accounts');
    if (!accountsResponse.ok) {
        throw new Error(`Error: ${accountsResponse.status}`);
    }
    const accountsData = await accountsResponse.json();
    const accounts: Account[] = accountsData.accounts;

    const categoriesResponse = await fetch('http://localhost:3000/api/get-categories');
    if (!categoriesResponse.ok) {
        throw new Error(`Error fetching categories: ${categoriesResponse.status}`);
    }
    const categoriesData = await categoriesResponse.json();
    const existingCategories: string[] = categoriesData.categories;

    return (
        <TransactionsPageClient
            transactions={nonInternalTransactions}
            accounts={accounts}
            categories={existingCategories}
        />
    );
} 