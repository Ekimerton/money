import { AccountBalancePage } from "./account-balance-page";
import { getAccountsData } from "@/lib/data";

export default async function AccountsPage() {
    const accounts = getAccountsData(365);
    return (
        <div>
            <AccountBalancePage accounts={accounts} />
        </div>
    );
} 