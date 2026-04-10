import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'child_process';
import { revalidateTag } from 'next/cache';
import { updateSettings } from '@/lib/settings';

const dbPath = path.join(process.cwd(), './data/user_data.db');
const trainModelScriptPath = path.join(process.cwd(), './data/train_model.py');
const pythonExecutablePath = path.join(process.cwd(), './data/.venv/bin/python');
const modelSavePath = path.join(process.cwd(), './data/model');

export async function POST(req: NextRequest) {
    try {
        const cmd = `${pythonExecutablePath} ${trainModelScriptPath} ${dbPath} ${modelSavePath}`;

        const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                if (error) {
                    const err: any = new Error(`Training failed: ${error.message}`);
                    err.stderr = stderr;
                    err.stdout = stdout;
                    return reject(err);
                }
                return resolve({ stdout, stderr });
            });
        });

        const now = new Date().toISOString();

        // Parse stdout to extract overall accuracy and per-category accuracy (recall per class)
        let overallAccuracy: number | undefined;
        try {
            const accMatch = stdout.match(/Model Accuracy:\s*([0-9.]+)/i);
            if (accMatch && accMatch[1]) overallAccuracy = parseFloat(accMatch[1]);
        } catch { }

        let perClassAccuracy: Array<{ label: string; accuracy: number; support: number }> | undefined;
        try {
            const lines = stdout.split(/\r?\n/);
            const startIdx = lines.findIndex((l) => /Classification Report:/i.test(l));
            if (startIdx !== -1) {
                perClassAccuracy = [];
                for (let i = startIdx + 1; i < lines.length; i++) {
                    const line = lines[i];
                    // stop at summary rows
                    if (/^(accuracy|macro avg|weighted avg)\b/i.test(line.trim())) break;
                    // match: label, precision, recall, f1-score, support
                    const m = line.match(/^\s*([^\s].*?\S)\s+([0-9]\.[0-9]+)\s+([0-9]\.[0-9]+)\s+([0-9]\.[0-9]+)\s+(\d+)\s*$/);
                    if (m) {
                        const label = m[1];
                        const recall = parseFloat(m[3]);
                        const support = parseInt(m[5], 10);
                        perClassAccuracy.push({ label, accuracy: recall, support });
                    }
                }
                if (perClassAccuracy.length === 0) perClassAccuracy = undefined;
            }
        } catch { }

        await updateSettings({ classifierTrainingDate: now });

        revalidateTag('settings');

        return NextResponse.json({ message: 'Model training completed', classifierTrainingDate: now, stdout, stderr, overallAccuracy, perClassAccuracy }, { status: 200 });
    } catch (error: any) {
        console.error('Error training model:', error);
        return NextResponse.json({ error: error.message, stderr: error?.stderr }, { status: 500 });
    }
}