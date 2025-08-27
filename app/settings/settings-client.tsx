'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

interface SettingsClientProps {
    initialDisplayName: string;
    initialClassifierTrainingDate: string | null;
    initialAutoCategorize: boolean;
}

export default function SettingsClient({
    initialDisplayName,
    initialClassifierTrainingDate,
    initialAutoCategorize,
}: SettingsClientProps) {
    const [displayName, setDisplayName] = useState<string>(initialDisplayName);
    const [autoCategorize] = useState<boolean>(initialAutoCategorize);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRefreshTime, setSelectedRefreshTime] = useState<string>("none");

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
        } finally {
            setLoading(false);
        }
    };

    const refreshRecent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/refresh-recent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autoCategorize }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to refresh recent data.');
            }
            await response.json();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {error && <p className="text-red-500">{error}</p>}

            {/* Basic Info */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Basic Info</h2>

                {/* Name Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label htmlFor="displayName">Name</Label>
                        <p className="text-xs text-muted-foreground">Your display name in the app</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
                        <Input
                            id="displayName"
                            placeholder="Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="max-w-sm w-full"
                        />
                        <Button onClick={saveUserName} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>
            </section>

            {/* SimpleFin Settings */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">SimpleFin Settings</h2>

                {/* Simplefin Login Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label>Simplefin Login</Label>
                        <p className="text-xs text-muted-foreground">Open Simplefin Bridge to manage your token</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
                        <Button asChild variant="secondary">
                            <a href="https://beta-bridge.simplefin.org/" target="_blank" rel="noopener noreferrer">Open</a>
                        </Button>
                    </div>
                </div>

                {/* Refresh Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label>Refresh</Label>
                        <p className="text-xs text-muted-foreground">this will fetch and override your data</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
                        <Button onClick={refreshRecent} disabled={loading}>
                            {loading ? 'Refreshing...' : 'Refresh recent'}
                        </Button>
                    </div>
                </div>

                {/* Auto refresh time Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label>Auto refresh time</Label>
                        <p className="text-xs text-muted-foreground">doesn't do anything for now</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
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

                {/* Delete simplefin settings Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label>Delete saved simplefin settings</Label>
                        <p className="text-xs text-muted-foreground">does nothing for now</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
                        <Button variant="destructive" onClick={() => { /* no-op for now */ }}>
                            Delete
                        </Button>
                    </div>
                </div>
            </section>

            {/* Classification Model */}
            <section className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold border-b border-border pb-2">Classification Model</h2>

                {/* Training info Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label>Training info</Label>
                        <p className="text-xs text-muted-foreground">Last time the model was trained</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
                        <p className="text-sm">
                            {initialClassifierTrainingDate
                                ? new Date(initialClassifierTrainingDate).toLocaleString()
                                : 'Not trained yet'}
                        </p>
                    </div>
                </div>

                {/* Retrain model Row */}
                <div className="flex flex-row sm:items-center sm:justify-between gap-16 max-sm:gap-2">
                    <div className="flex flex-col sm:pr-8 w-48 sm:w-64 sm:flex-shrink-0">
                        <Label>Retrain model</Label>
                        <p className="text-xs text-muted-foreground">Recomputes the classifier</p>
                    </div>
                    <div className="flex items-center gap-16 max-sm:gap-2 sm:flex-1">
                        <Button
                            onClick={async () => {
                                setLoading(true);
                                setError(null);
                                try {
                                    const response = await fetch('/api/train-model', { method: 'POST' });
                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        throw new Error(errorData.error || 'Failed to train model.');
                                    }
                                } catch (err: any) {
                                    setError(err.message);
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
            </section>
        </div>
    );
}


