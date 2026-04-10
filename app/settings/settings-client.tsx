'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SquareArrowOutUpRightIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { setAutoCategorize as setAutoCategorizeAction, setAutoMarkInternalTransfers, refreshRecent as refreshRecentAction } from "@/app/settings/actions";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface SettingsClientProps {
    initialDisplayName: string;
    initialClassifierTrainingDate: string | null;
    initialAutoCategorize: boolean;
    initialMarkDuplicates?: boolean;
}

export default function SettingsClient({
    initialDisplayName,
    initialClassifierTrainingDate,
    initialAutoCategorize,
    initialMarkDuplicates = false,
}: SettingsClientProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [displayName, setDisplayName] = useState<string>(initialDisplayName);
    const [autoCategorize, setAutoCategorize] = useState<boolean>(initialAutoCategorize);
    const [isRefreshingRecent, setIsRefreshingRecent] = useState<boolean>(false);
    const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);
    const [isTrainingModel, setIsTrainingModel] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [markDuplicates, setMarkDuplicates] = useState<boolean>(initialMarkDuplicates);
    const [detectRecurring, setDetectRecurring] = useState<boolean>(false);
    const [classifierTrainingDate, setClassifierTrainingDate] = useState<string | null>(initialClassifierTrainingDate);

    const refreshRecent = async () => {
        setIsRefreshingRecent(true);
        setError(null);
        const promise = refreshRecentAction();
        toast.promise(promise, {
            position: 'top-center',
            loading: 'Fetching new transactions from Simplefin...',
            success: (result) => {
                const newTx = result?.newTransactions ?? 0;
                const samples: Array<any> = Array.isArray(result?.newTransactionSamples) ? result.newTransactionSamples : [];
                const items = samples.map((t: any) => `${t.title} [${t.category || 'Uncategorized'}]`);
                const shown = items.slice(0, 5);
                const moreCount = Math.max(0, newTx - shown.length);
                const descriptionNode = shown.length > 0 ? (
                    <div className="flex flex-col">
                        {shown.map((line: string, idx: number) => (
                            <div key={idx}>{line}</div>
                        ))}
                        {moreCount > 0 && (
                            <div className="text-muted-foreground">+{moreCount} more…</div>
                        )}
                    </div>
                ) : undefined;
                return { message: `Fetched ${newTx} ${newTx === 1 ? 'transaction' : 'transactions'}`, ...(descriptionNode ? { description: descriptionNode } : {}) } as any;
            },
            error: (err) => err?.message || 'Failed to fetch new transactions from simplefin.',
            finally: () => setIsRefreshingRecent(false),
        });
        try {
            await promise;
        } catch (err: any) {
            setError(err?.message || 'Failed to refresh recent data.');
        }
    };

    const refreshAll = async () => {
        setIsRefreshingAll(true);
        setError(null);
        try {
            const { refreshAll } = await import("@/app/settings/actions");
            const result = await refreshAll();
            const newTx = result.newTransactions ?? 0;
            const cat = result.categorizedCount ?? 0;
            const dup = result.updatedDuplicates ?? 0;
            toast.success(`Full refresh: ${newTx} new transactions, ${cat} categorized, ${dup} marked duplicate`, { position: 'top-center' });
        } catch (err: any) {
            const msg = err?.message || 'Failed to perform full refresh.';
            setError(msg);
            toast.error(msg, { position: 'top-center' });
        } finally {
            setIsRefreshingAll(false);
        }
    };

    const handleAutoCategorizeToggle = async (newValue: boolean) => {
        if (!classifierTrainingDate) return;
        const prev = autoCategorize;
        setAutoCategorize(newValue);
        try {
            await setAutoCategorizeAction(newValue);
        } catch (err) {
            setAutoCategorize(prev);
        }
    };

    const handleMarkDuplicatesToggle = async (newValue: boolean) => {
        const prev = markDuplicates;
        setMarkDuplicates(newValue);
        try {
            await setAutoMarkInternalTransfers(newValue);
        } catch (err) {
            setMarkDuplicates(prev);
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:w-full max-sm:w-screen p-4">
            {error && <p className="text-red-500">{error}</p>}

            {/* Basic Info */}
            { /*
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Basic Info</h2>

                <div className="flex flex-col gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label htmlFor="displayName">Name</Label>
                    </div>
                    <div className="flex items-center gap-2 max-sm:gap-2 sm:flex-1">
                        <Input
                            id="displayName"
                            placeholder="Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="max-w-60 w-full"
                        />
                        <Button size="sm" onClick={saveUserName} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </section>
            */}

            {/* SimpleFin Settings */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Data Fetching</h2>

                {/* Simplefin Login Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Simplefin Login</Label>
                        <p className="text-xs text-muted-foreground">Open Simplefin Bridge to add new accounts or check connection health.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button size="sm" variant="secondary" asChild>
                            <a href="https://beta-bridge.simplefin.org/" target="_blank" rel="noopener noreferrer">Open <SquareArrowOutUpRightIcon className="ml-1 size-3" aria-hidden="true" /></a>
                        </Button>
                    </div>
                </div>

                {/* Mark Duplicates Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Mark Duplicate Transactions</Label>
                        <p className="text-xs text-muted-foreground">Automatically mark transfers between connected accounts as internal transfers.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch checked={markDuplicates} onCheckedChange={handleMarkDuplicatesToggle} />
                    </div>
                </div>

                {/* Auto-Classify Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Auto-Classify Transactions</Label>
                        <p className="text-xs text-muted-foreground">Requires a trained classification model before enabling.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch disabled={!initialClassifierTrainingDate} checked={autoCategorize} onCheckedChange={handleAutoCategorizeToggle} />
                    </div>
                </div>

                {/* Detect Recurring Transactions Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Detect Recurring Transactions</Label>
                        <p className="text-xs text-muted-foreground">No effect yet; toggle is for future functionality.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch checked={detectRecurring} onCheckedChange={setDetectRecurring} />
                    </div>
                </div>

                {/* Refresh Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Refresh Data Manually</Label>
                        <p className="text-xs text-muted-foreground">This will fetch all data since last refresh.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button size="sm" variant="secondary" onClick={refreshRecent} disabled={isRefreshingRecent} >
                            {isRefreshingRecent ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Auto refresh time Row 
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Auto refresh time</Label>
                        <p className="text-xs text-muted-foreground">doesn't do anything for now</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Select value={selectedRefreshTime} onValueChange={setSelectedRefreshTime}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="1h">Every hour</SelectItem>
                                <SelectItem value="6h">Every 6 hours</SelectItem>
                                <SelectItem value="24h">Every day</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                */}

            </section >

            {/* Appearance */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Appearance</h2>

                {/* Theme Toggle Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Dark Mode</Label>
                        <p className="text-xs text-muted-foreground">Toggle between light and dark theme.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch
                            checked={(resolvedTheme ?? theme) === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        />
                    </div>
                </div>
            </section>

            {/* Classification Model */}
            < section className="flex flex-col gap-4" >
                <h2 className="text-lg font-semibold border-b border-border pb-2">Classification Model</h2>

                {/* Training info Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Training info</Label>
                        <p className="text-xs text-muted-foreground">Last time the model was trained</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <p className="text-sm">
                            {classifierTrainingDate
                                ? (() => {
                                    const now = new Date();
                                    const trained = new Date(classifierTrainingDate);
                                    const diffMs = now.getTime() - trained.getTime();
                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                    return diffDays <= 0
                                        ? 'Today'
                                        : diffDays === 1
                                            ? '1 day ago'
                                            : `${diffDays} days ago`;
                                })()
                                : 'Not trained yet'}
                        </p>
                    </div>
                </div>

                {/* Retrain model Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Retrain model</Label>
                        <p className="text-xs text-muted-foreground">Recomputes the classifier</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                setIsTrainingModel(true);
                                setError(null);
                                const promise = (async () => {
                                    const response = await fetch('/api/train-model', { method: 'POST' });
                                    const data = await response.json();
                                    if (!response.ok) {
                                        throw new Error(data?.error || 'Failed to train model.');
                                    }
                                    return data;
                                })();
                                toast.promise(promise, {
                                    position: 'top-center',
                                    loading: 'Training model...',
                                    success: (data: any) => {
                                        if (data?.classifierTrainingDate) {
                                            setClassifierTrainingDate(data.classifierTrainingDate);
                                        }
                                        const perClass = Array.isArray(data?.perClassAccuracy) ? data.perClassAccuracy : [];
                                        const overall = typeof data?.overallAccuracy === 'number' ? data.overallAccuracy : undefined;
                                        const descriptionNode = (overall !== undefined || perClass.length > 0) ? (
                                            <div className="flex flex-col">
                                                {overall !== undefined && (
                                                    <div><span className="font-semibold">Overall</span>: {(overall * 100).toFixed(1)}%</div>
                                                )}
                                                {perClass.slice(0, 6).map((c: any) => (
                                                    <div key={c.label}><span className="font-semibold">{c.label}</span>: {(c.accuracy * 100).toFixed(1)}% ({c.support})</div>
                                                ))}
                                            </div>
                                        ) : undefined;
                                        return { message: 'Model training completed', ...(descriptionNode ? { description: descriptionNode } : {}) } as any;
                                    },
                                    error: (err: any) => err?.message || 'Failed to train model.',
                                    finally: () => setIsTrainingModel(false),
                                });
                                try {
                                    await promise;
                                } catch (err: any) {
                                    setError(err?.message || 'Failed to train model.');
                                }
                            }}
                            disabled={isTrainingModel}
                        >
                            {isTrainingModel ? 'Training...' : 'Retrain model'}
                        </Button>
                    </div>
                </div>
            </section >

            {/* Local Data */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Local Data</h2>

                {/* Refresh All Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Refresh All Data</Label>
                        <p className="text-xs text-muted-foreground">Fetches all historical data (since 2000-01-01).</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button size="sm" variant="secondary" onClick={refreshAll} disabled={isRefreshingAll}>
                            {isRefreshingAll ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Delete simplefin settings Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Delete Saved Simplefin Token</Label>
                        <p className="text-xs text-muted-foreground">does nothing for now</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button size="sm" variant="secondary" onClick={() => { /* no-op for now */ }}>
                            Delete
                        </Button>
                    </div>
                </div>
            </section>
        </div >
    );
}


