import { Account } from "@/lib/types";
import { AccountBalancePage } from "./account-balance-page";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
    const days = 365;
    const response = await fetch(`http://localhost:3000/api/get-accounts?days=${days}`, {
        next: { tags: ["accounts", "transactions"] },
    });

    if (!response.ok) {
        const errorText = await response.text();
        // TODO: [DEBUG] Remove this extra logging once the production issues are fully stabilized.
        console.error(`Failed to load accounts. Status: ${response.status}. Error: ${errorText}`);
        throw new Error(`Failed to load accounts: ${response.status}`);
    }

    const data = await response.json();
    const rawAccounts = (data?.accounts ?? []) as any[];

    const accounts: Account[] = rawAccounts.map((r: any) => ({
        id: String(r.id),
        name: String(r.name ?? ''),
        currency: String(r.currency ?? 'USD'),
        balance: String(r.balance),
        "balance-date": Number(r.balance_date ?? 0),
        type: String(r.type ?? ''),
        balanceHistory: Array.isArray(r.balanceHistory)
            ? r.balanceHistory.map((h: any) => ({
                date: String(h.date),
                balance: Number(h.balance),
            }))
            : [],
    }));

    return (
        <div>
            <AccountBalancePage accounts={accounts} />
        </div>
    );
}