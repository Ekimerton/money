'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EllipsisIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { Account } from "@/lib/types";

interface AccountsTableClientProps {
    accounts: Account[];
    timeRange: string;
}

export function AccountsTableClient({ accounts, timeRange }: AccountsTableClientProps) {
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [editedName, setEditedName] = useState("");
    const [editedType, setEditedType] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const openSettings = (account: Account) => {
        setSelectedAccount(account);
        setEditedName(account.name ?? "");
        setEditedType(account.type ?? "");
        setIsSettingsOpen(true);
    };

    const handleSave = async () => {
        if (!selectedAccount) return;
        try {
            setIsSaving(true);
            const updates: Promise<Response>[] = [];

            if (editedName.trim() && editedName.trim() !== selectedAccount.name) {
                updates.push(
                    fetch('/api/update-account-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accountId: selectedAccount.id, newName: editedName.trim() }),
                    })
                );
            }

            if (editedType.trim() && editedType.trim() !== selectedAccount.type) {
                updates.push(
                    fetch('/api/update-account-type', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accountId: selectedAccount.id, newType: editedType.trim() }),
                    })
                );
            }

            if (updates.length > 0) {
                const responses = await Promise.all(updates);
                const anyFailed = responses.some(r => !r.ok);
                if (anyFailed) {
                    console.error('Failed to save one or more updates');
                }
                // On successful updates, refresh to re-fetch data tagged with "accounts"
                if (!anyFailed) {
                    router.refresh();
                }
            }
        } finally {
            setIsSaving(false);
            setIsSettingsOpen(false);
        }
    };

    // Match the time window semantics used in `account-balance-page.tsx`
    const getDaysForTimeRange = (range: string): number => {
        switch (range) {
            case "7d":
                return 7;
            case "30d":
                return 30;
            case "365d":
                return 365;
            case "90d":
            default:
                return 90;
        }
    };

    // Compute percent change using first and last history entries inside the selected time window
    const getAccountBalanceChange = (account: Account) => {
        const history = (account.balanceHistory || [])
            .map((h) => ({ ...h, dateStr: h.date }))
            .filter((h) => Boolean(h.dateStr))
            .sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0));

        if (history.length === 0) {
            return { percentValue: "N/A", className: "" };
        }

        const daysToSubtract = getDaysForTimeRange(timeRange);
        const now = new Date();
        const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startUTC = new Date(utcMidnight);
        startUTC.setUTCDate(startUTC.getUTCDate() - daysToSubtract);
        const startDateStr = startUTC.toISOString().split("T")[0];

        const historyInRange = history.filter((h) => h.dateStr >= startDateStr);

        // If there is at least one point, use first and last within the range.
        // If there is exactly one point, change is 0.
        // If there are none in range, mirror page semantics by treating change as 0.
        let startBalance = 0;
        let endBalance = 0;

        if (historyInRange.length >= 2) {
            startBalance = historyInRange[0].balance;
            endBalance = historyInRange[historyInRange.length - 1].balance;
        } else if (historyInRange.length === 1) {
            startBalance = historyInRange[0].balance;
            endBalance = historyInRange[0].balance;
        } else {
            // No data in the selected range
            return { percentValue: "N/A", className: "" };
        }

        const change = endBalance - startBalance;
        const className = change > 0 ? "text-green-700" : change < 0 ? "text-red-700" : "";

        // Percent display rules
        if (startBalance === 0) {
            if (change !== 0) return { percentValue: "", className: "" };
            return { percentValue: "0%", className: "" };
        }

        const percentageChange = Math.round((change / startBalance) * 100);
        const percentSign = change > 0 ? "+" : change < 0 ? "-" : "";
        const percentValue = `${percentSign}${Math.abs(percentageChange)}%`;

        return { percentValue, className };
    };

    const totals = useMemo(() => {
        let totalBalance = 0;
        let startBalanceTotal = 0;

        const daysToSubtract = getDaysForTimeRange(timeRange);
        const now = new Date();
        const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const startUTC = new Date(utcMidnight);
        startUTC.setUTCDate(startUTC.getUTCDate() - daysToSubtract);
        const startDateStr = startUTC.toISOString().split("T")[0];

        accounts.forEach(account => {
            const current = parseFloat(account.balance);
            totalBalance += current;

            const history = (account.balanceHistory || [])
                .map((h) => ({ ...h, dateStr: h.date }))
                .filter((h) => Boolean(h.dateStr))
                .sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0));

            const historyInRange = history.filter((h) => h.dateStr >= startDateStr);
            if (historyInRange.length > 0) {
                startBalanceTotal += historyInRange[0].balance;
            } else {
                startBalanceTotal += current;
            }
        });

        const change = totalBalance - startBalanceTotal;
        const className = change > 0 ? "text-green-700" : change < 0 ? "text-red-700" : "";
        let percentValue = "0%";
        if (startBalanceTotal !== 0) {
            const percentageChange = Math.round((change / startBalanceTotal) * 100);
            const percentSign = change > 0 ? "+" : change < 0 ? "-" : "";
            percentValue = `${percentSign}${Math.abs(percentageChange)}%`;
        }

        return { balance: totalBalance, percentValue, className };
    }, [accounts, timeRange]);

    return (
        <div className="p-4">
            {/* Total Row for Mobile */}
            <Link
                prefetch={true}
                href="/transactions"
                className="sm:hidden block border-b py-2 hover:bg-muted/60"
            >
                <div className="flex w-full items-center justify-between text-left font-medium">
                    <div className="flex items-center space-x-1 text-neutral-900 dark:text-neutral-100">
                        <span>Total</span>
                    </div>
                    <div className="flex items-center space-x-2 text-neutral-900 dark:text-neutral-100">
                        <span className="">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                            }).format(totals.balance)}
                        </span>
                    </div>
                </div>
                <div className="pt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex justify-between">
                        All Accounts
                        <span className={totals.className}>{totals.percentValue}</span>
                    </div>
                </div>
            </Link>


            {accounts.map((account) => {

                const change = getAccountBalanceChange(account);
                return (
                    <Link
                        key={account.id}
                        prefetch={true}
                        href={`/transactions/?account=${encodeURIComponent(account.id)}`}
                        className="block border-b last:border-b-0 py-2 hover:bg-muted/60"
                    >
                        <div className="flex w-full items-center justify-between text-left font-medium">
                            <div className="flex items-center space-x-1 text-neutral-900 dark:text-neutral-100">
                                <span>{account.name}</span>
                                <Button
                                    variant="ghost"
                                    size="iconSm"
                                    aria-label="Account settings"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openSettings(account);
                                    }}
                                >
                                    <EllipsisIcon className="size-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="flex items-center space-x-2 text-neutral-900 dark:text-neutral-100">
                                <span className="">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: account.currency || 'USD',
                                    }).format(parseFloat(account.balance))}
                                </span>
                            </div>
                        </div>
                        <div className="pt-1 text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="flex justify-between">
                                {account.type}
                                <span className={change.className}>{change.percentValue}</span>
                            </div>
                        </div>
                    </Link>
                );
            })}

            <ResponsiveDrawer
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                trigger={<span className="hidden" />}
                title="Edit account"
                description="Update the account name or category. Changes are saved immediately on Save."
                showDrawerCancel={false}
                drawerFooter={
                    <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="account-name">Name</Label>
                        <Input
                            id="account-name"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Account name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="account-type">Category</Label>
                        <Input
                            id="account-type"
                            value={editedType}
                            onChange={(e) => setEditedType(e.target.value)}
                            placeholder="Account category/type"
                        />
                    </div>
                    <div className="hidden md:flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </div>
            </ResponsiveDrawer>
        </div>
    );
}