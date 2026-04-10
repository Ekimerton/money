import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { updateSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
    try {
        const { SETUP_TOKEN } = await req.json();

        if (!SETUP_TOKEN) {
            return NextResponse.json({ error: 'SETUP_TOKEN is required.' }, { status: 400 });
        }

        const CLAIM_URL = Buffer.from(SETUP_TOKEN, 'base64').toString('utf-8');

        const claimResponse = await fetch(CLAIM_URL, {
            method: 'POST',
            headers: {
                'Content-Length': '0',
            },
        });

        if (!claimResponse.ok) {
            throw new Error(`Failed to claim URL: ${claimResponse.statusText}`);
        }

        const ACCESS_URL = await claimResponse.text();

        await updateSettings({ simplefinUrl: ACCESS_URL });

        revalidateTag('settings');
        return NextResponse.json({ message: 'SimpleFIN URL saved successfully!', simplefinUrl: ACCESS_URL }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving SimpleFIN URL:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}