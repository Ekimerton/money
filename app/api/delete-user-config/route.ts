import { NextRequest, NextResponse } from 'next/server';
import { updateSettings } from '@/lib/settings';

export async function POST(_req: NextRequest) {
    try {
        await updateSettings({
            displayName: undefined,
            classifierTrainingDate: null,
            autoCategorize: false,
            autoMarkDuplicates: false,
            onboardingCompleted: false,
            autoRefreshDaily: false
        });

        return NextResponse.json({ message: 'User configuration deleted successfully.' }, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting user configuration:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

