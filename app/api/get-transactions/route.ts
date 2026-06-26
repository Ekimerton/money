
import { NextRequest } from 'next/server';
import { getTransactions } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const transactions = getTransactions(accountId, month, year);

    return new Response(JSON.stringify({ transactions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error loading transactions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 