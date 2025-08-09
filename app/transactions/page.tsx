import { TransactionsTableClient } from "@/components/transactions-table-client";

interface Account {
    id: string;
    name: string;
    currency: string;
    balance: string;
    "balance-date": number;
}

interface Transaction {
    id: string;
    account_id: string;
    posted: number;
    amount: string;
    description: string;
    payee: string | null;
    transacted_at: number | null;
    pending: boolean;
    hidden: boolean;
    category: string;
}

export default async function TransactionsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const accountId = searchParams.account;

    const transactionsUrl = accountId ? `http://localhost:3000/api/get-transactions?accountId=${accountId}` : 'http://localhost:3000/api/get-transactions';
    const transactionsResponse = await fetch(transactionsUrl);
    if (!transactionsResponse.ok) {
        throw new Error(`Error: ${transactionsResponse.status}`);
    }
    const transactionsData = await transactionsResponse.json();
    const transactions: Transaction[] = transactionsData.transactions;

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
        <div className="w-full">
            <div className="p-2">
                <TransactionsTableClient
                    initialTransactions={transactions}
                    initialAccounts={accounts}
                    initialCategories={existingCategories}
                />
            </div>
        </div>
    );
} 