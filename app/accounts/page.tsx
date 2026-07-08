import { AccountBalancePage } from "./account-balance-page";
import { getAccounts } from "@/lib/data";

export default async function AccountsPage() {
    const accounts = getAccounts(365);

    return (
        <div>
            <AccountBalancePage accounts={accounts} />
        </div>
    );
}
