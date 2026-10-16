import fs from 'fs/promises';
import { getDataPath } from './paths';

export type InsightChartType =
    | 'cumulative'
    | 'pie'
    | 'area'
    | 'bar'
    | 'stacked_bar'
    | 'multi_line';

export interface InsightChartPayload {
    id: string;
    title: string;
    subtitle?: string;
    chart: InsightChartType;
    sql: string;
    rows: any[];
}

export interface InsightChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    charts?: InsightChartPayload[];
    followUps?: string[];
    error?: string;
    promptContext?: string;
    createdAt: number;
}

export interface InsightThread {
    id: string;
    firstPrompt: string;
    createdAt: number;
    updatedAt: number;
    messages: InsightChatMessage[];
}

export interface UserSettings {
    geminiApiKey?: string;
    displayName?: string;
    simplefinUrl?: string;
    classifierTrainingDate?: string | null;
    autoCategorize?: boolean;
    autoMarkDuplicates?: boolean;
    onboardingCompleted?: boolean;
    autoRefreshDaily?: boolean;
}

const SETTINGS_PATH = getDataPath('user-settings.json');
const INSIGHTS_HISTORY_PATH = getDataPath('insights-history.json');

export async function getSettings(): Promise<UserSettings> {
    try {
        const data = await fs.readFile(SETTINGS_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

export async function updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await getSettings();
    const updated = { ...current, ...updates };
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 4), 'utf-8');
    return updated;
}

export async function getInsightThreads(): Promise<InsightThread[]> {
    try {
        const data = await fs.readFile(INSIGHTS_HISTORY_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function upsertInsightThread(thread: InsightThread): Promise<InsightThread[]> {
    const current = await getInsightThreads();
    const normPrompt = thread.firstPrompt.trim().toLowerCase();
    const filtered = current.filter(
        (t) => t.id !== thread.id && t.firstPrompt.trim().toLowerCase() !== normPrompt
    );
    const lightThread: InsightThread = {
        id: thread.id,
        firstPrompt: thread.firstPrompt.trim(),
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: [],
    };
    const updated = [lightThread, ...filtered].slice(0, 50);
    await fs.writeFile(INSIGHTS_HISTORY_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
}

export async function deleteInsightThread(id: string): Promise<InsightThread[]> {
    const current = await getInsightThreads();
    const updated = current.filter((t) => t.id !== id);
    await fs.writeFile(INSIGHTS_HISTORY_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
}
