const { generateResumeContent } = require('./services/llm');

const profileContent = "Software Engineer with 5 years experience in React and Node.js";
const jobDescription = "Looking for a Senior Frontend Engineer with experience in React and weak AI";
const templateStyle = "\\documentclass{article}\n\\begin{document}\nResume content here\n\\end{document}";

async function test() {
    console.log("Testing generateResumeContent...");
    const result = await generateResumeContent(profileContent, jobDescription, templateStyle);
    if (result) {
        console.log("✅ Success! Output received:");
        console.log(result.substring(0, 100) + "...");
    } else {
        console.log("❌ Failed to generate content.");
    }
}

test();
