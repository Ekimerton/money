import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from '@/lib/revalidate';
import { updateSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
    try {
        const { autoCategorize } = await req.json();

        if (typeof autoCategorize !== 'boolean') {
            return NextResponse.json({ error: 'autoCategorize must be a boolean.' }, { status: 400 });
        }
        
        await updateSettings({ autoCategorize });

        revalidateTag('settings');
        return NextResponse.json({ message: 'Auto categorize setting saved successfully!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error saving auto categorize setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
