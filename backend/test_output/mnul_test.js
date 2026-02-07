import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- DEBUG SECTION ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// This looks for .env in the root (two folders up from test_output)
const envPath = path.resolve(__dirname, '../../.env');

console.log("Checking for .env at:", envPath);
dotenv.config({ path: envPath });

if (!process.env.GOOGLE_API_KEY) {
    console.error("❌ ERROR: GOOGLE_API_KEY is still undefined!");
    console.log("Current process.env keys:", Object.keys(process.env).filter(k => !k.includes('SESSION')));
    process.exit(1);
} else {
    console.log("✅ GOOGLE_API_KEY found!");
}
// ---------------------

async function main() {
    const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_API_KEY
    });

    try {
        console.log("Calling Gemini 2.5 Flash...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Respond with the word SUCCESS if you can hear me.' }] }]
        });

        console.log("Result:", response.text);
    } catch (e) {
        console.error("❌ API Error:", e.message);
    }
}

main();