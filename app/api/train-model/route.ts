
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { exec } from 'child_process';
import { revalidateTag } from 'next/cache';

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
        const db = new Database(dbPath);
        db.prepare(`
            INSERT INTO user_config (id, classifier_training_date)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                classifier_training_date = excluded.classifier_training_date
        `).run(now);
        db.close();

        revalidateTag('settings');

        return NextResponse.json({ message: 'Model training completed', classifierTrainingDate: now, stdout, stderr }, { status: 200 });
    } catch (error: any) {
        console.error('Error training model:', error);
        return NextResponse.json({ error: error.message, stderr: error?.stderr }, { status: 500 });
    }
}