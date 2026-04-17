import { Transaction } from "@/lib/types";
import { TransactionWithAccount } from "./lib/utils";
import PlayerCardClient from "./player-card-client";

export const dynamic = "force-dynamic";

export default async function PlayerCardPage() {
    const [transactionsResponse, accountsResponse] = await Promise.all([
        fetch('http://localhost:3000/api/get-transactions', { next: { tags: ['transactions'] } }),
        fetch('http://localhost:3000/api/get-accounts', { next: { tags: ['accounts'] } })
    ]);
    
    if (!transactionsResponse.ok || !accountsResponse.ok) {
        throw new Error(`Error: ${transactionsResponse.status} ${accountsResponse.status}`);
    }
    
    const [transactionsData, accountsData] = await Promise.all([
        transactionsResponse.json(),
        accountsResponse.json()
    ]);

    const transactionsRaw: Transaction[] = transactionsData.transactions;
    const accounts = accountsData.accounts;
    
    // Enrich transactions with account types for better behavioral analysis
    const accountTypeMap = new Map<string, string>(
        accounts.map((acc: any) => [acc.id, acc.type])
    );
    const transactions: TransactionWithAccount[] = transactionsRaw.map(t => ({
        ...t,
        accountType: accountTypeMap.get(t.account_id)
    }));

    const totalBalance = accounts.reduce((acc: number, curr: any) => acc + (parseFloat(curr.balance) || 0), 0);
    const savingsBalance = accounts
        .filter((acc: any) => acc.type?.toLowerCase().includes("savings"))
        .reduce((acc: number, curr: any) => acc + (parseFloat(curr.balance) || 0), 0);


    return (
        <div>
            <PlayerCardClient 
                transactions={transactions} 
                totalBalance={totalBalance} 
                savingsBalance={savingsBalance} 
            />
        </div>
    );

}
