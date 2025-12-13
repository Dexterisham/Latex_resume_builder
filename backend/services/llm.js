const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateResumeContent = async (profileContent, jobDescription, templateStyle) => {
    try {
        console.log("🤖 Calling Google AI (gemini-2.5-flash)...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert resume writer and LaTeX coder.

    TASK:
        Generate a COMPLETE, COMPILE - READY LaTeX resume file.

    INPUTS:
1. MY PROFILE(Source Data):
        ${profileContent}

2. TARGET JOB DESCRIPTION(Tailor the content to this):
        ${jobDescription}

3. LATEX STYLE REFERENCE(Follow this structure, packages, and formatting EXACTLY):
        ${templateStyle}

INSTRUCTIONS:
- Output ONLY the raw LaTeX code starting with \\documentclass and ending with \\end{ document }.
- Do NOT return JSON.Return the.tex file content.
        - Tailor the "Professional Summary", "Skills", and "Experience" bullet points to match the JD keywords.
        - KEEP the exact formatting commands from the reference style(e.g.\\begin{ joblong }, \\section{}, etc.).
        - Do not include markdown code blocks(like \`\`\`latex). Just the code.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log("✅ AI LaTeX Output received (" + text.length + " chars)");

        // Cleanup markdown code blocks if present
        if (text.includes("```latex")) {
            text = text.split("```latex")[1].split("```")[0];
        } else if (text.startsWith("```")) {
            text = text.substring(3, text.length - 3);
        }

        return text.trim();
    } catch (error) {
        console.error("❌ Error calling Google AI:", error.message);
        return null;
    }
};

module.exports = { generateResumeContent };

