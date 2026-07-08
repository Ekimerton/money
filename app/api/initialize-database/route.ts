import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // getDb() handles initialization and schema creation automatically
    getDb();

    return NextResponse.json({ message: 'Database initialized successfully!' }, { status: 200 });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
