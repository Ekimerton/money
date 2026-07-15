import fs from 'fs/promises';
import path from 'path';

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

import { getDataPath } from './paths';

const SETTINGS_PATH = getDataPath('user-settings.json');

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
