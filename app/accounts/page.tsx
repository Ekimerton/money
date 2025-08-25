import { AccountBalancePage } from "./account-balance-page";
import { AccountsTableClient } from "./accounts-table-client";
import { Account } from "@/lib/types";

export default async function AccountsPage() {
    const accountsResponse = await fetch('http://localhost:3000/api/get-accounts?days=365', {
        next: {
            tags: ['accounts', 'transactions']
        }
    });
    if (!accountsResponse.ok) {
        throw new Error(`Error: ${accountsResponse.status}`);
    }
    const accountsData = await accountsResponse.json();
    const accounts: Account[] = accountsData.accounts;

    return (
        <div>
            <AccountBalancePage accounts={accounts} />
        </div>
    );
} 