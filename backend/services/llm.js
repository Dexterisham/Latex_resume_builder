const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

// The new SDK uses 'apiKey' in an options object
const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const generateResumeContent = async (profileContent, jobDescription, templateStyle) => {
    try {
        console.log("🤖 Calling Google AI (gemini-2.5-flash)...");

        const prompt = `
        You are an expert resume writer and LaTeX coder.

        TASK:
        Generate a COMPLETE, COMPILE-READY LaTeX resume file.

        INPUTS:
        1. MY PROFILE (Source Data):
        ${profileContent}

        2. TARGET JOB DESCRIPTION (Tailor the content to this):
        ${jobDescription}

        3. LATEX STYLE REFERENCE:
        ${templateStyle}

        INSTRUCTIONS:
        - Output ONLY raw LaTeX code (starting with \\documentclass).
        - Do NOT return JSON or markdown backticks (\`\`\`latex).
        - Tailor the bullet points to match the JD keywords.
        - Keep the exact formatting commands from the reference style.
        `;

        // Updated call for @google/genai SDK
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        // The text is now a direct property on the response
        let text = response.text;

        console.log("✅ AI LaTeX Output received (" + (text?.length || 0) + " chars)");

        // Cleanup markdown code blocks if the AI ignored instructions
        if (text.includes("```latex")) {
            text = text.split("```latex")[1].split("```")[0];
        } else if (text.startsWith("```")) {
            const parts = text.split("```");
            text = parts[1] || parts[0];
        }

        return text.trim();
    } catch (error) {
        console.error("❌ Error calling Google AI:", error.message);
        return null;
    }
};

module.exports = { generateResumeContent };