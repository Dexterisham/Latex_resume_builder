const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const apiKey = process.env.GOOGLE_API_KEY;

console.log("🔍 Diagnosing AI Connection...");
console.log("🔑 API Key Present:", apiKey ? "Yes (Starts with " + apiKey.substring(0, 4) + ")" : "NO");

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say 'Test Success' if you can read this.");
        const response = await result.response;
        console.log(`✅ SUCCESS with ${modelName}!`);
        console.log(`   Response: ${response.text()}`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED with ${modelName}`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function run() {
    // Try the most likely models
    const models = ["gemini-pro", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];

    let workingModel = null;

    for (const m of models) {
        if (await testModel(m)) {
            workingModel = m;
            break;
        }
    }

    if (workingModel) {
        console.log(`\n🎉 CONCLUSION: Use model "${workingModel}" in your code.`);
    } else {
        console.log("\n💀 CONCLUSION: No models worked. Check your API Key or Billing.");
    }
}

run();
