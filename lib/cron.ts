import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';

import { getSettings } from './settings';

export function startCronJobs() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        let runRefresh = false;
        try {
            const settings = await getSettings();
            if (settings.autoRefreshDaily) {
                runRefresh = true;
            }
        } catch (e) {
            console.error('Error checking cron config:', e);
        }

        if (runRefresh) {
            console.log('Running daily auto-refresh...');
            try {
                // We use dynamic import for a server action to avoid issues with direct `use server` imports in pure node scripts
                const { refreshRecent } = await import('@/app/settings/actions');
                await refreshRecent();
                console.log('Daily auto-refresh complete.');
            } catch (err) {
                console.error('Daily auto-refresh failed:', err);
            }
        }
    });
}
