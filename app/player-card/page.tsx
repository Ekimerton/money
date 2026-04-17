import { Transaction } from "@/lib/types";
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

    const transactions: Transaction[] = transactionsData.transactions;
    const accounts = accountsData.accounts;
    const totalBalance = accounts.reduce((acc: number, curr: any) => acc + (curr.balance || 0), 0);

    return (
        <div>
            <PlayerCardClient transactions={transactions} totalBalance={totalBalance} />
        </div>
    );

}
