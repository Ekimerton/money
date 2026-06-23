import SpendingPageClient from "@/app/spending/spending-page";
import { Account, Transaction } from "@/lib/types";
import { getTransactions, getAccounts } from "@/lib/data";

export default async function SpendingPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    const accountId = (resolvedSearchParams.accountId ?? resolvedSearchParams.account) as string | undefined;

    const transactions = getTransactions(accountId);
    const accounts = getAccounts();

    return (
        <SpendingPageClient
            transactions={transactions}
            accounts={accounts}
        />
    );
}
