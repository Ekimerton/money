'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircleIcon, AlertTriangleIcon, CopyIcon, CheckIcon, SquareArrowOutUpRightIcon, XIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { setAutoCategorize as setAutoCategorizeAction, setAutoMarkInternalTransfers, refreshRecent as refreshRecentAction, setAutoRefreshDaily as setAutoRefreshDailyAction } from "@/app/settings/actions";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

interface UiErrorState {
    source: 'recent' | 'all' | 'train';
    title: string;
    message: string;
    details?: string;
}

interface UiWarningState {
    source: 'recent' | 'all';
    items: string[];
}

function buildFallbackError(err: any, fallbackMessage: string): { message: string; details?: string } {
    const message = err?.message || fallbackMessage;
    const detailParts: string[] = [];
    if (err?.digest) {
        detailParts.push(`Next.js digest: ${err.digest}`);
    }
    if (err?.cause) {
        detailParts.push(`Cause: ${err.cause?.message || String(err.cause)}`);
    }
    if (typeof err?.stack === 'string' && err.stack !== message) {
        detailParts.push(err.stack);
    }
    return {
        message,
        details: detailParts.length > 0 ? detailParts.join('\n') : undefined,
    };
}

function ErrorAlertBox({
    error,
    onDismiss,
}: {
    error: UiErrorState;
    onDismiss: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const copyPayload = error.details ? `${error.title}: ${error.message}\n\n${error.details}` : `${error.title}: ${error.message}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(copyPayload);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy error details');
        }
    };

    return (
        <div
            role="alert"
            className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300 flex flex-col gap-2"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    <AlertCircleIcon className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="min-w-0">
                        <div className="font-semibold">{error.title}</div>
                        <p className="break-words whitespace-pre-wrap">{error.message}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 px-2 text-xs text-red-700 dark:text-red-300 hover:bg-red-500/15"
                    >
                        {copied ? <CheckIcon className="size-3.5 mr-1" aria-hidden="true" /> : <CopyIcon className="size-3.5 mr-1" aria-hidden="true" />}
                        {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        aria-label="Dismiss error"
                        className="h-7 w-7 p-0 text-red-700 dark:text-red-300 hover:bg-red-500/15"
                    >
                        <XIcon className="size-3.5" aria-hidden="true" />
                    </Button>
                </div>
            </div>
            {error.details && (
                <details className="mt-1">
                    <summary className="cursor-pointer text-xs font-medium select-none opacity-90 hover:opacity-100">
                        Technical details
                    </summary>
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-black/10 dark:bg-black/30 p-2 text-xs font-mono whitespace-pre-wrap break-words">
                        {error.details}
                    </pre>
                </details>
            )}
        </div>
    );
}

function WarningAlertBox({
    warnings,
    onDismiss,
}: {
    warnings: string[];
    onDismiss: () => void;
}) {
    return (
        <div
            role="status"
            className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-start justify-between gap-2"
        >
            <div className="flex items-start gap-2 min-w-0">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                    <div className="font-semibold">SimpleFIN reported warnings</div>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 break-words">
                        {warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                aria-label="Dismiss warnings"
                className="h-7 w-7 p-0 shrink-0 text-amber-800 dark:text-amber-300 hover:bg-amber-500/15"
            >
                <XIcon className="size-3.5" aria-hidden="true" />
            </Button>
        </div>
    );
}

interface SettingsClientProps {
    initialDisplayName: string;
    initialClassifierTrainingDate: string | null;
    initialAutoCategorize: boolean;
    initialMarkDuplicates?: boolean;
    initialAutoRefreshDaily?: boolean;
}

export default function SettingsClient({
    initialDisplayName,
    initialClassifierTrainingDate,
    initialAutoCategorize,
    initialMarkDuplicates = false,
    initialAutoRefreshDaily = false,
}: SettingsClientProps) {
    const router = useRouter();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [displayName, setDisplayName] = useState<string>(initialDisplayName);
    const [autoCategorize, setAutoCategorize] = useState<boolean>(initialAutoCategorize);
    const [isRefreshingRecent, setIsRefreshingRecent] = useState<boolean>(false);
    const [isRefreshingAll, setIsRefreshingAll] = useState<boolean>(false);
    const [isTrainingModel, setIsTrainingModel] = useState<boolean>(false);
    const [uiError, setUiError] = useState<UiErrorState | null>(null);
    const [uiWarnings, setUiWarnings] = useState<UiWarningState | null>(null);
    const [markDuplicates, setMarkDuplicates] = useState<boolean>(initialMarkDuplicates);
    const [detectRecurring, setDetectRecurring] = useState<boolean>(false);
    const [classifierTrainingDate, setClassifierTrainingDate] = useState<string | null>(initialClassifierTrainingDate);
    const [autoRefreshDaily, setAutoRefreshDaily] = useState<boolean>(initialAutoRefreshDaily);

    const refreshRecent = async () => {
        setIsRefreshingRecent(true);
        setUiError(null);
        setUiWarnings(null);
        try {
            const promise = (async () => {
                const res = await refreshRecentAction();
                if (!res.ok || res.error) {
                    const actionErr: any = new Error(res.error || 'Failed to fetch new transactions from SimpleFIN.');
                    actionErr.details = res.errorDetails;
                    actionErr.warnings = res.warnings;
                    throw actionErr;
                }
                return res;
            })();
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
            });
            const result = await promise;
            if (result.warnings && result.warnings.length > 0) {
                setUiWarnings({ source: 'recent', items: result.warnings });
            }
            router.refresh();
        } catch (err: any) {
            const fallback = buildFallbackError(err, 'Failed to refresh recent data.');
            setUiError({
                source: 'recent',
                title: 'Refresh Data Failed',
                message: fallback.message,
                details: err?.details || fallback.details,
            });
            if (Array.isArray(err?.warnings) && err.warnings.length > 0) {
                setUiWarnings({ source: 'recent', items: err.warnings });
            }
        } finally {
            setIsRefreshingRecent(false);
        }
    };

    const refreshAll = async () => {
        setIsRefreshingAll(true);
        setUiError(null);
        setUiWarnings(null);
        const toastId = toast.loading('Fetching all historical data from SimpleFIN...', { position: 'top-center' });
        try {
            const { refreshAll } = await import("@/app/settings/actions");
            const result = await refreshAll();
            if (!result.ok || result.error) {
                const msg = result.error || 'Failed to perform full refresh.';
                setUiError({
                    source: 'all',
                    title: 'Refresh All Data Failed',
                    message: msg,
                    details: result.errorDetails,
                });
                if (result.warnings && result.warnings.length > 0) {
                    setUiWarnings({ source: 'all', items: result.warnings });
                }
                toast.error(msg, { id: toastId, position: 'top-center', duration: 8000 });
                return;
            }
            if (result.warnings && result.warnings.length > 0) {
                setUiWarnings({ source: 'all', items: result.warnings });
            }
            const newTx = result.newTransactions ?? 0;
            const cat = result.categorizedCount ?? 0;
            const dup = result.updatedDuplicates ?? 0;
            toast.success(`Full refresh: ${newTx} new transactions, ${cat} categorized, ${dup} marked duplicate`, { id: toastId, position: 'top-center' });
            router.refresh();
        } catch (err: any) {
            const fallback = buildFallbackError(err, 'Failed to perform full refresh.');
            setUiError({
                source: 'all',
                title: 'Refresh All Data Failed',
                message: fallback.message,
                details: fallback.details,
            });
            toast.error(fallback.message, { id: toastId, position: 'top-center', duration: 8000 });
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

    const handleAutoRefreshDailyToggle = async (newValue: boolean) => {
        const prev = autoRefreshDaily;
        setAutoRefreshDaily(newValue);
        try {
            await setAutoRefreshDailyAction(newValue);
        } catch (err) {
            setAutoRefreshDaily(prev);
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:w-full max-sm:w-screen p-4 pb-8">
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
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                        <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                            <Label>Refresh Data Manually</Label>
                            <p className="text-xs text-muted-foreground">This will fetch all data since last refresh.</p>
                        </div>
                        <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={refreshRecent}
                                disabled={isRefreshingRecent}
                                aria-label={isRefreshingRecent ? 'Refreshing... recent data' : 'Refresh recent data'}
                            >
                                {isRefreshingRecent ? 'Refreshing...' : 'Refresh'}
                            </Button>
                        </div>
                    </div>
                    {uiError?.source === 'recent' && (
                        <ErrorAlertBox error={uiError} onDismiss={() => setUiError(null)} />
                    )}
                    {uiWarnings?.source === 'recent' && uiWarnings.items.length > 0 && (
                        <WarningAlertBox warnings={uiWarnings.items} onDismiss={() => setUiWarnings(null)} />
                    )}
                </div>

                {/* Auto refresh daily Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                        <Label>Refresh Data Daily</Label>
                        <p className="text-xs text-muted-foreground">Automatically fetch new data every day at midnight.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch checked={autoRefreshDaily} onCheckedChange={handleAutoRefreshDailyToggle} />
                    </div>
                </div>

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
                <div className="flex flex-col gap-2">
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
                                    setUiError(null);
                                    try {
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
                                        });
                                        await promise;
                                    } catch (err: any) {
                                        const fallback = buildFallbackError(err, 'Failed to train model.');
                                        setUiError({
                                            source: 'train',
                                            title: 'Model Training Failed',
                                            message: fallback.message,
                                            details: fallback.details,
                                        });
                                    } finally {
                                        setIsTrainingModel(false);
                                    }
                                }}
                                disabled={isTrainingModel}
                            >
                                {isTrainingModel ? 'Training...' : 'Retrain model'}
                            </Button>
                        </div>
                    </div>
                    {uiError?.source === 'train' && (
                        <ErrorAlertBox error={uiError} onDismiss={() => setUiError(null)} />
                    )}
                </div>
            </section >

            {/* Local Data */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Local Data</h2>

                {/* Refresh All Row */}
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                        <div className="flex flex-col sm:pr-8 w-60 sm:w-lg sm:flex-shrink-0">
                            <Label>Refresh All Data</Label>
                            <p className="text-xs text-muted-foreground">Fetches all historical data (since 2000-01-01).</p>
                        </div>
                        <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={refreshAll}
                                disabled={isRefreshingAll}
                                aria-label={isRefreshingAll ? 'Refreshing... all historical data' : 'Refresh all historical data'}
                            >
                                {isRefreshingAll ? 'Refreshing...' : 'Refresh'}
                            </Button>
                        </div>
                    </div>
                    {uiError?.source === 'all' && (
                        <ErrorAlertBox error={uiError} onDismiss={() => setUiError(null)} />
                    )}
                    {uiWarnings?.source === 'all' && uiWarnings.items.length > 0 && (
                        <WarningAlertBox warnings={uiWarnings.items} onDismiss={() => setUiWarnings(null)} />
                    )}
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


