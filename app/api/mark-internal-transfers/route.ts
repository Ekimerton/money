import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), './data/user_data.db');

export async function POST(_req: NextRequest) {
    const db = new Database(dbPath);
    try {
        const threeDaysInSeconds = 3 * 24 * 60 * 60;

        const updateSql = `
      WITH pairs AS (
        SELECT t1.id AS id1, t2.id AS id2
        FROM transactions t1
        JOIN transactions t2
          ON t1.id < t2.id
         AND t1.account_id != t2.account_id
         AND CAST(t1.amount AS REAL) = -CAST(t2.amount AS REAL)
         AND ABS(COALESCE(t1.transacted_at, t1.posted) - COALESCE(t2.transacted_at, t2.posted)) <= ${threeDaysInSeconds}
      )
      UPDATE transactions
         SET category = 'Internal Transfer'
       WHERE id IN (
         SELECT id1 FROM pairs
         UNION
         SELECT id2 FROM pairs
       );
    `;

        const result = db.prepare(updateSql).run();
        const updated = result.changes || 0;

        return NextResponse.json({ updated }, { status: 200 });
    } catch (error: any) {
        console.error('Error marking internal transfers:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    } finally {
        db.close();
    }
}


