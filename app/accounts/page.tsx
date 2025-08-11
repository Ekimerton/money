import { AccountBalanceChart } from "./account-balance-chart";
import { AccountsTableClient } from "./accounts-table-client";

interface Account {
    id: string;
    name: string;
    currency: string;
    balance: string;
    "balance-date": number;
    type: string;
    balanceHistory?: { date: string; balance: number }[]; // Re-add balanceHistory to the interface
}

export default async function AccountsPage() {
    const accountsResponse = await fetch('http://localhost:3000/api/get-accounts?days=365', {
        cache: 'no-store'
    });
    if (!accountsResponse.ok) {
        throw new Error(`Error: ${accountsResponse.status}`);
    }
    const accountsData = await accountsResponse.json();
    const accounts: Account[] = accountsData.accounts;

    return (
        <div className="w-full max-sm:max-w-screen">
            <div className="p-0 max-sm:p-2">
                <AccountBalanceChart accounts={accounts} />
                <AccountsTableClient initialAccounts={accounts} />
            </div>
        </div>
    );
} 