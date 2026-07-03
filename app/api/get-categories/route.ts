import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import path from 'path';


export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const categories = db.prepare('SELECT DISTINCT category FROM transactions').all().map((row: any) => row.category);
        return NextResponse.json({ categories });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 