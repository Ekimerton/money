
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

        // Update the last_classifier_model_training_date in user_config
        const now = new Date().toISOString();
        db.prepare('INSERT INTO user_config (name, classifier_training_date) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET classifier_training_date=excluded.classifier_training_date').run('classifier_training_date_key', now);
        db.close();

        return NextResponse.json({ message: 'Model training initiated and date updated!' }, { status: 200 });
    } catch (error: any) {
        console.error('Error training model:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}