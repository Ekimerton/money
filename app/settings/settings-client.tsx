'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SquareArrowOutUpRightIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { setAutoCategorize as setAutoCategorizeAction, setAutoMarkInternalTransfers, refreshRecent as refreshRecentAction } from "@/app/settings/actions";
import { toast } from "sonner";

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
    const [displayName, setDisplayName] = useState<string>(initialDisplayName);
    const [autoCategorize, setAutoCategorize] = useState<boolean>(initialAutoCategorize);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRefreshTime, setSelectedRefreshTime] = useState<string>("none");
    const [markDuplicates, setMarkDuplicates] = useState<boolean>(initialMarkDuplicates);
    const [detectRecurring, setDetectRecurring] = useState<boolean>(false);

    const saveUserName = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/save-user-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: displayName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save user name.');
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message || 'Failed to save user name.');
        } finally {
            setLoading(false);
        }
    };

    const refreshRecent = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await refreshRecentAction();
            const newTx = result.newTransactions ?? 0;
            const cat = result.categorizedCount ?? 0;
            const dup = result.updatedDuplicates ?? 0;
            toast.success(`Fetched ${newTx} new transactions, ${cat} categorized, ${dup} marked duplicate`);
        } catch (err: any) {
            const msg = err?.message || 'Failed to refresh recent data.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const refreshAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await refreshRecentAction(true);
            const newTx = result.newTransactions ?? 0;
            const cat = result.categorizedCount ?? 0;
            const dup = result.updatedDuplicates ?? 0;
            toast.success(`Full refresh: ${newTx} new transactions, ${cat} categorized, ${dup} marked duplicate`);
        } catch (err: any) {
            const msg = err?.message || 'Failed to perform full refresh.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCategorizeToggle = async (newValue: boolean) => {
        if (!initialClassifierTrainingDate) return;
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
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
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
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
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
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Mark Duplicate Transactions</Label>
                        <p className="text-xs text-muted-foreground">Automatically mark transfers between connected accounts as internal transfers.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch checked={markDuplicates} onCheckedChange={handleMarkDuplicatesToggle} />
                    </div>
                </div>

                {/* Auto-Classify Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Auto-Classify Transactions</Label>
                        <p className="text-xs text-muted-foreground">Requires a trained classification model before enabling.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch disabled={!initialClassifierTrainingDate} checked={autoCategorize} onCheckedChange={handleAutoCategorizeToggle} />
                    </div>
                </div>

                {/* Detect Recurring Transactions Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Detect Recurring Transactions</Label>
                        <p className="text-xs text-muted-foreground">No effect yet; toggle is for future functionality.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-3 flex-1">
                        <Switch checked={detectRecurring} onCheckedChange={setDetectRecurring} />
                    </div>
                </div>

                {/* Refresh Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Refresh Data Manually</Label>
                        <p className="text-xs text-muted-foreground">This will fetch all data since last refresh.</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button size="sm" variant="secondary" onClick={refreshRecent} disabled={loading} >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Auto refresh time Row 
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
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

            {/* Classification Model */}
            < section className="flex flex-col gap-4" >
                <h2 className="text-lg font-semibold border-b border-border pb-2">Classification Model</h2>

                {/* Training info Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Training info</Label>
                        <p className="text-xs text-muted-foreground">Last time the model was trained</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <p className="text-sm">
                            {initialClassifierTrainingDate
                                ? (() => {
                                    const now = new Date();
                                    const trained = new Date(initialClassifierTrainingDate);
                                    const diffMs = now.getTime() - trained.getTime();
                                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                    return diffDays === 0
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
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Retrain model</Label>
                        <p className="text-xs text-muted-foreground">Recomputes the classifier</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                    const response = await fetch('/api/train-model', { method: 'POST' });
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || 'Failed to train model.');
                                    }
                                    toast.success('Model training started');
                                } catch (err: any) {
                                    setError(err.message);
                                    toast.error(err.message || 'Failed to train model.');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            {loading ? 'Training...' : 'Retrain model'}
                        </Button>
                    </div>
                </div>
            </section >

            {/* Local Data */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Local Data</h2>

                {/* Refresh All Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
                        <Label>Refresh All Data</Label>
                        <p className="text-xs text-muted-foreground">Fetches all historical data (since 2000-01-01).</p>
                    </div>
                    <div className="flex items-center max-sm:justify-end gap-16 max-sm:gap-2 flex-1">
                        <Button size="sm" variant="secondary" onClick={refreshAll} disabled={loading}>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>

                {/* Delete simplefin settings Row */}
                <div className="flex flex-row sm:items-center gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-60 sm:w-96 sm:flex-shrink-0">
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


