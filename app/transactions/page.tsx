import { Account, Transaction } from "@/lib/types";
import { TransactionsTableClient } from "@/components/transactions-table-client";

export default async function TransactionsTablePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    // Support both `accountId` (preferred) and legacy `account`
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const { getTransactionsData, getAccountsData, getCategoriesData } = await import("@/lib/data");
    const transactions: Transaction[] = getTransactionsData(accountId);
    const accounts: Account[] = getAccountsData();
    const existingCategories: string[] = getCategoriesData();

    return (
        <TransactionsTableClient
            initialTransactions={transactions}
            initialAccounts={accounts}
            initialCategories={existingCategories}
            timeRange={"90d"}
        />
    );
}