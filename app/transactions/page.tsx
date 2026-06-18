import { TransactionsTableClient } from "@/components/transactions-table-client";
import { getTransactionsCached, getAccountsCached, getCategoriesCached } from "@/lib/data-helpers";

export default async function TransactionsTablePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const transactions = await getTransactionsCached(accountId);
    const accounts = await getAccountsCached();
    const existingCategories = await getCategoriesCached();

    return (
        <TransactionsTableClient
            initialTransactions={transactions}
            initialAccounts={accounts}
            initialCategories={existingCategories}
            timeRange={"90d"}
        />
    );
}
