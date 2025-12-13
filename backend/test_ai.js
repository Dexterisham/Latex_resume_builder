const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function test() {
    console.log("Testing Google AI Connection...");
    console.log("API Key present:", !!process.env.GOOGLE_API_KEY);

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Try gemini-pro first
        console.log("Attempting with model: gemini-pro");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say hello in one word.");
        const response = await result.response;
        console.log("✅ Success! Response:", response.text());
    } catch (error) {
        console.error("❌ Error with gemini-pro:", error.message);
    }
}

test();
