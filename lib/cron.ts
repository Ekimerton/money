import cron from 'node-cron';
import Database from 'better-sqlite3';
import path from 'path';

export function startCronJobs() {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        const dbPath = path.join(process.cwd(), './data/user_data.db');
        const db = new Database(dbPath);
        let runRefresh = false;
        try {
            const userConfig = db.prepare('SELECT auto_refresh_daily FROM user_config WHERE id = 1').get() as any;
            if (userConfig?.auto_refresh_daily) {
                runRefresh = true;
            }
        } catch (e) {
            console.error('Error checking cron config:', e);
        } finally {
            db.close();
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
