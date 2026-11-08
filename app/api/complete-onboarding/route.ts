import { NextRequest, NextResponse } from 'next/server';
import { updateSettings } from '@/lib/settings';

export async function POST(_req: NextRequest) {
    try {
        await updateSettings({ onboardingCompleted: true });
        return NextResponse.json({ message: 'Onboarding marked complete' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Failed to complete onboarding' }, { status: 500 });
    }
}


