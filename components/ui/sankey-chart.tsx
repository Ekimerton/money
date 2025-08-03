"use client"

import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";

interface Transaction {
    id: string;
    account_id: string;
    amount: number;
    transacted_at: number;
    description: string;
    category: string;
}

interface Account {
    id: string;
    name: string;
}

interface SankeyNode {
    id: string;
    name: string;
}

interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

export function IncomeExpenseSankeyChart({ transactions, accounts }: { transactions: Transaction[], accounts: Account[] }) {
    const data = useMemo(() => {
        const nodesMap = new Map<string, SankeyNode>();
        const aggregatedLinks = new Map<string, { source: string; target: string; value: number }>();

        // Define fixed nodes
        const totalIncomeNodeId = "Total Income";
        const totalExpensesNodeId = "Total Expenses";
        nodesMap.set(totalIncomeNodeId, { id: totalIncomeNodeId, name: totalIncomeNodeId });
        nodesMap.set(totalExpensesNodeId, { id: totalExpensesNodeId, name: totalExpensesNodeId });

        let overallIncome = 0;

        // Process transactions for Accounts -> Income and Expenses -> Categories
        transactions.forEach(transaction => {
            const amount = Number(transaction.amount);
            const category = transaction.category || "Uncategorized";
            const account = accounts.find(acc => acc.id === transaction.account_id);
            const accountName = account ? account.name : `Account ${transaction.account_id.substring(0, 4)}...`;

            // Ensure account node exists
            if (accountName && !nodesMap.has(accountName)) {
                nodesMap.set(accountName, { id: accountName, name: accountName });
            }

            if (amount > 0) {
                // Accounts -> Total Income
                const linkKey = `${accountName}-${totalIncomeNodeId}`;
                const existingLink = aggregatedLinks.get(linkKey);
                if (existingLink) {
                    existingLink.value += amount;
                } else {
                    aggregatedLinks.set(linkKey, { source: accountName, target: totalIncomeNodeId, value: amount });
                }
                overallIncome += amount; // Accumulate overall income
            } else {
                // Total Expenses -> Categories
                if (!nodesMap.has(category)) {
                    nodesMap.set(category, { id: category, name: category });
                }
                const linkKey = `${totalExpensesNodeId}-${category}`;
                const existingLink = aggregatedLinks.get(linkKey);
                if (existingLink) {
                    existingLink.value += Math.abs(amount);
                } else {
                    aggregatedLinks.set(linkKey, { source: totalExpensesNodeId, target: category, value: Math.abs(amount) });
                }
            }
        });

        // Add Total Income -> Total Expenses link
        if (overallIncome > 0) {
            aggregatedLinks.set(`${totalIncomeNodeId}-${totalExpensesNodeId}`, {
                source: totalIncomeNodeId,
                target: totalExpensesNodeId,
                value: overallIncome,
            });
        }

        const nodes = Array.from(nodesMap.values());
        const links = Array.from(aggregatedLinks.values());

        // Recharts Sankey expects node indices in links, not string IDs.
        // Map node IDs to their indices in the nodes array.
        const nodeIndexMap = new Map<string, number>();
        nodes.forEach((node, index) => {
            nodeIndexMap.set(node.id, index);
        });

        const formattedLinks = links.map(link => ({
            source: nodeIndexMap.get(link.source)!,
            target: nodeIndexMap.get(link.target)!,
            value: link.value,
        }));

        return { nodes, links: formattedLinks };
    }, [transactions, accounts]);

    return (
        <Card className="pt-0">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Income and Expense Flow</CardTitle>
                    <CardDescription>
                        Visualization of income and expenses by category.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={{}} // SankeyChart doesn't use ChartConfig directly for colors in the same way
                    className="aspect-auto h-[400px] w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <Sankey
                            data={data}
                            nodePadding={10}
                            nodeWidth={10}
                            linkCurvature={0.5}
                            iterations={32}
                        >
                            <Tooltip />
                        </Sankey>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
} 