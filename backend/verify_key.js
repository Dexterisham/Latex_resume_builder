
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

const logFile = path.join(__dirname, 'key_debug.log');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

log("Checking .env loading...");
if (result.error) {
    log("❌ dotenv error: " + result.error.message);
} else {
    log("✅ dotenv loaded successfully.");
}

const key = process.env.GOOGLE_API_KEY;

if (!key) {
    log("❌ GOOGLE_API_KEY is missing or empty.");
} else {
    log(`✅ GOOGLE_API_KEY found. Length: ${key.length}`);
    if (key.startsWith("AIza")) {
        log("✅ Key starts with 'AIza' (looks valid format).");
    } else {
        log(`❌ Key does NOT start with 'AIza'. Starts with: '${key.substring(0, 5)}...'`);
    }

    // Check if it's a placeholder
    if (key.includes("YOUR_API_KEY") || key.includes("example")) {
        log("⚠️ Key looks like a placeholder.");
    }
}
