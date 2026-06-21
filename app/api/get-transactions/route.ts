import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const transactions = getTransactions(accountId || undefined, month || undefined, year || undefined);

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error: any) {
    console.error('Error loading transactions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
