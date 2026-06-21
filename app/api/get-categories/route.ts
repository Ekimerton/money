import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/data';

export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
