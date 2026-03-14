const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

// The new SDK uses 'apiKey' in an options object
const client = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const generateResumeContent = async (profileContent, jobDescription, templateStyle, instructions, model = 'gemini-2.5-flash') => {
    try {
        console.log(`🤖 Calling Google AI (${model})...`);

        const prompt = `
        You are an expert resume writer and LaTeX coder.

        TASK:
        Generate a clean, modern, and professional one-page resume.

        STRICT RULES:
        1. Keep the design minimal and clean.
        2. Use simple formatting (no fancy symbols, no emojis, no graphics).
        3. Do NOT mention any company name in the Objective/Summary section.
        4. Keep the Objective short (2–3 lines maximum).
        5. Use strong action verbs.
        6. Focus on measurable achievements where possible.
        7. Keep bullet points concise (1–2 lines each).
        8. No first-person pronouns (no "I", "me", "my").
        9. Do not exaggerate skills.
        10. Make it ATS-friendly (simple headings, no tables).
        11. Keep it professional and clean.
        12. Use consistent formatting for dates and locations.
        13. Do not include references.
        14. Avoid unnecessary personal details (no photo, no age, no marital status).
        15. Make it suitable for the provided Job Description role.

        Avoid generic phrases like "hardworking", "team player", or "seeking a challenging position".
        Focus only on value and skills.

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
        ${instructions ? `\nEXTRA INSTRUCTIONS:\n${instructions}` : ''}
        `;

        // Updated call for @google/genai SDK
        const response = await client.models.generateContent({
            model: model,
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

const getAvailableModels = async () => {
    try {
        // Fallback or specific logic if SDK doesn't support easy listing in v1
        // But let's try a direct fetch which is reliable for API keys
        const apiKey = process.env.GOOGLE_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.models) {
            return data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace("models/", ""));
        }
        return ['gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']; // Fallback
    } catch (error) {
        console.error("Error fetching models:", error);
        return ['gemini-2.5-flash', 'gemini-1.5-pro']; // Fallback
    }
};

module.exports = { generateResumeContent, getAvailableModels };