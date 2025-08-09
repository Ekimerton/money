
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { exec } from 'child_process';

const dbPath = path.join(process.cwd(), './data/user_data.db');
const trainModelScriptPath = path.join(process.cwd(), './data/train_model.py');
const pythonExecutablePath = path.join(process.cwd(), './data/.venv/bin/python');
const modelSavePath = path.join(process.cwd(), './data/model');

export async function POST(req: NextRequest) {
    try {
        const db = new Database(dbPath);

        // Execute the Python script
        exec(`${pythonExecutablePath} ${trainModelScriptPath} ${dbPath} ${modelSavePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });

        // Update classifier_training_date in single-row user_config (id = 1)
        const now = new Date().toISOString();
        db.prepare(`
            INSERT INTO user_config (id, classifier_training_date)
            VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET
                classifier_training_date = excluded.classifier_training_date
        `).run(now);
        db.close();

        return NextResponse.json({ message: 'Model training initiated and date updated!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error training model:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}