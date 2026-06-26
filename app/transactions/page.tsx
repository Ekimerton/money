import { TransactionsTableClient } from "@/components/transactions-table-client";
import { getAccounts, getCategories, getTransactions } from "@/lib/data";

export default async function TransactionsTablePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const transactions = getTransactions(accountId);
    const accounts = getAccounts();
    const existingCategories = getCategories();

    return (
        <TransactionsTableClient
            initialTransactions={transactions}
            initialAccounts={accounts}
            initialCategories={existingCategories}
            timeRange={"90d"}
        />
    );
}