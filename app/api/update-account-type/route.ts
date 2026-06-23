import { getDb } from "@/lib/db";

const db = getDb();

export async function POST(request: Request) {
    try {
        const { accountId, newType } = await request.json();

        if (!accountId || !newType) {
            return new Response(JSON.stringify({ error: 'Account ID and new type are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const stmt = db.prepare('UPDATE accounts SET type = ? WHERE id = ?');
        stmt.run(newType, accountId);

        // Return the updated account type
        return new Response(JSON.stringify({ id: accountId, type: newType }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error updating account type in DB:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 