import Database from 'better-sqlite3';
import path from 'path';
import { getDataPath } from '@/lib/paths';
import { revalidateTag } from '@/lib/revalidate';

const dbPath = getDataPath('user_data.db');
const db = new Database(dbPath);

export async function POST(request: Request) {
    try {
        const { accountId, newName } = await request.json();

        if (!accountId || !newName) {
            return new Response(JSON.stringify({ error: 'Account ID and new name are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const stmt = db.prepare('UPDATE accounts SET name = ? WHERE id = ?');
        stmt.run(newName, accountId);

        // Invalidate cached accounts data
        revalidateTag('accounts');

        // Return the updated account name
        return new Response(JSON.stringify({ id: accountId, name: newName }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error updating account name in DB:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 