"use client";

import * as React from "react";
import { Transaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryPopover } from "@/components/ui/category-popover";

interface BacklogClientProps {
    initialTransactions: Transaction[];
    initialCategories: string[];
}

export function BacklogClient({ initialTransactions, initialCategories }: BacklogClientProps) {
    const [queue, setQueue] = React.useState<Transaction[]>(() => initialTransactions);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [categories, setCategories] = React.useState<string[]>(() => initialCategories);
    const current = queue[currentIndex];

    const suggestedCategories = React.useMemo(() => categories.slice(0, 3), [categories]);

    const markCategory = async (category: string) => {
        if (!current) return;
        const txId = current.id;
        const res = await fetch("/api/update-transaction-category", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId: txId, newCategory: category }),
        });
        if (!res.ok) {
            console.error("Failed to update category");
            return;
        }
        // Optimistically remove this item and advance
        setQueue((prev) => prev.filter((t) => t.id !== txId));
        setCurrentIndex(0);
        // Keep categories list fresh
        if (category && !categories.includes(category)) {
            setCategories((prev) => [...prev, category].sort((a, b) => a.localeCompare(b)));
        }
    };

    const skip = () => {
        if (currentIndex < queue.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    if (!queue.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>All caught up</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>There are no uncategorized transactions.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-xl pt-12">
            {/* Mobile header count */}
            <div className="sm:hidden text-center text-xs text-muted-foreground pb-4">
                — {queue.length} uncategorized transactions —
            </div>

            <Card>
                {/* Desktop header */}
                <CardHeader className="hidden sm:block text-center">
                    <CardTitle>Uncategorized transaction ({queue.length} left)</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 text-center">
                    {/* Unified content (works for all sizes) */}
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                            {new Date((current.transacted_at || current.posted) * 1000).toLocaleDateString()}
                        </div>
                        <div className="text-2xl font-semibold">
                            {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(current.amount))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {(current.payee || "").toString()}
                            {current.payee && current.description ? ", " : ""}
                            {(current.description || "").toString()}
                        </div>
                    </div>

                </CardContent>
            </Card>
            {/* Actions below the card */}
            <div className="flex flex-col gap-2 mt-4 items-stretch">
                {suggestedCategories.map((c) => (
                    <Button key={c} className="w-full" variant="secondary" onClick={() => markCategory(c)}>
                        {c}
                    </Button>
                ))}
                <CategoryPopover
                    defaultValue={""}
                    suggestions={categories}
                    onSubmit={markCategory}
                    trigger={<Button className="w-full" variant="outline">Custom</Button>}
                />
                <Button className="w-full" variant="secondary" onClick={() => markCategory("Internal Transfer")}>
                    Mark Internal Transfer
                </Button>
                <Button className="w-full" variant="ghost" onClick={skip}>
                    Skip
                </Button>
            </div>
        </div>
    );
}


