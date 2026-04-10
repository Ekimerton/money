import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { revalidateTag } from 'next/cache';
import { updateSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
    try {
        const { userName } = await req.json();
        if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
            return NextResponse.json({ error: 'userName is required.' }, { status: 400 });
        }
        
        await updateSettings({ displayName: userName.trim() });

        revalidateTag('settings');
        return NextResponse.json({ message: 'User name saved successfully!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving user name:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}