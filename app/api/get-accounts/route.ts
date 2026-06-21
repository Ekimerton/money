import { NextResponse } from 'next/server';
import { getAccounts } from '@/lib/data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const accounts = getAccounts(days);

    return NextResponse.json({ accounts }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching accounts and calculating historical balances:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
