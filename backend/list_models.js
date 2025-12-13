const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // Note: The Node SDK might not directly expose listModels easily in v1, 
    // but let's try a direct fetch if the SDK doesn't expose it, 
    // or use the heuristic of trying to hit the API endpoint.
    // Actually, we can use the API key to make a raw HTTP request to list models 
    // if the SDK doesn't have a helper.

    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (Supported methods: ${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        } else {
            console.log("No models field in response:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
