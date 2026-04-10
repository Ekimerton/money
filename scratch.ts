import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const apiKey = JSON.parse(fs.readFileSync('./data/user-settings.json', 'utf8')).geminiApiKey;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    tools: [
        {
            functionDeclarations: [
                {
                    name: 'explore_database',
                    description: 'Run a read-only SQLite query to explore the data.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            query: { type: 'STRING' }
                        },
                        required: ['query']
                    }
                }
            ]
        }
    ]
});

async function run() {
    const chat = model.startChat();
    const result = await chat.sendMessage('What are the different categories in the table?');
    console.log(JSON.stringify(result.response.functionCalls(), null, 2));
}

run().catch(console.error);
