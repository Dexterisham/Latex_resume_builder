const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateResumeContent } = require('./services/llm');
const { compilePdf } = require('./services/pdf');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const OUTPUT_DIR = path.join(DATA_DIR, 'resumes');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
if (!fs.existsSync(HISTORY_PATH)) fs.writeFileSync(HISTORY_PATH, '[]');

// --- Helper Functions ---
const getHistory = () => {
    try {
        return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    } catch (e) { return []; }
};

const saveHistory = (record) => {
    const history = getHistory();
    history.unshift(record); // Add to top
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
};

const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
};

const formatProfileForPrompt = (data) => {
    let output = "";
    if (data.personal_info) {
        output += `PERSONAL INFO:\nName: ${data.personal_info.name}\nEmail: ${data.personal_info.email}\nPhone: ${data.personal_info.phone}\nLinkedIn: ${data.personal_info.linkedin}\nGitHub: ${data.personal_info.github}\n\n`;
    }
    if (data.skills && data.skills.length) {
        output += `SKILLS:\n${data.skills.join(', ')}\n\n`;
    }
    if (data.experience && data.experience.length) {
        output += `EXPERIENCE:\n`;
        data.experience.forEach(exp => {
            output += `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}\n`;
        });
        output += `\n`;
    }
    if (data.projects && data.projects.length) {
        output += `PROJECTS:\n`;
        data.projects.forEach(proj => {
            output += `- ${proj.name} [${proj.tech}]: ${proj.details}\n`;
        });
        output += `\n`;
    }
    if (data.achievements_story && data.achievements_story.length) {
        output += `KEY ACHIEVEMENTS (STORY FORMAT):\n`;
        data.achievements_story.forEach(story => {
            output += `- ${story.title}: ${story.story}\n`;
        });
        output += `\n`;
    }
    return output;
};

// --- Routes ---

app.get('/', (req, res) => {
    res.json({ message: "Resume Builder API (Node.js) is running" });
});

app.get('/profile', (req, res) => {
    if (!fs.existsSync(PROFILE_PATH)) {
        // Return default empty structure
        return res.json({
            personal_info: { name: "", email: "", phone: "", linkedin: "", github: "" },
            skills: [],
            experience: [],
            projects: [],
            achievements_story: []
        });
    }
    try {
        const data = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
        res.json(data);
    } catch (e) {
        console.error("Error parsing profile.json", e);
        res.status(500).json({ detail: "Error parsing profile data" });
    }
});

app.post('/profile', (req, res) => {
    const profileData = req.body; // Expecting JSON
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profileData, null, 2), 'utf-8');
    res.json({ message: "Profile updated successfully" });
});

app.get('/templates', (req, res) => {
    try {
        const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.tex'));
        res.json({ templates: files });
    } catch (e) {
        res.status(500).json({ detail: "Error listing templates" });
    }
});

app.get('/history', (req, res) => {
    res.json({ history: getHistory() });
});

app.post('/generate', async (req, res) => {
    console.log("\n📝 New Resume Generation Request");
    const { job_description, template_name, custom_name } = req.body;

    // 1. Read Profile
    if (!fs.existsSync(PROFILE_PATH)) {
        console.warn("❌ Profile not found");
        return res.status(400).json({ detail: "Profile not found. Please save your profile first." });
    }

    let profileContent = "";
    try {
        const profileData = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
        profileContent = formatProfileForPrompt(profileData);
    } catch (e) {
        console.error("Error reading profile.json in generate", e);
        return res.status(500).json({ detail: "Error reading profile data." });
    }

    // 2. Read Styles (Template) for reference
    const templatePath = path.join(TEMPLATES_DIR, template_name || 'template.tex');
    let templateStyle = "";
    if (fs.existsSync(templatePath)) {
        templateStyle = fs.readFileSync(templatePath, 'utf-8');
    } else {
        console.warn(`❌ Template not found: ${templatePath}`);
    }

    // 3. AI Generation (Requesting Full LaTeX)
    const generatedTex = await generateResumeContent(profileContent, job_description, templateStyle);
    if (!generatedTex) {
        return res.status(500).json({ detail: "Failed to generate content from AI." });
    }

    // 4. Save Temp .tex (Directly use AI output)
    const runId = uuidv4();
    const tempTexPath = path.join(OUTPUT_DIR, `${runId}.tex`);
    fs.writeFileSync(tempTexPath, generatedTex, 'utf-8');

    // 5. Prepare History Record
    const record = {
        id: runId,
        timestamp: new Date().toISOString(),
        name: custom_name || job_description.substring(0, 30) + "...",
        template: template_name,
        status: 'pending',
        tex_file: `${runId}.tex`,
        pdf_file: null,
        error: null
    };

    // 6. Compile PDF
    try {
        const pdfPath = await compilePdf(tempTexPath, OUTPUT_DIR);
        let filename = path.basename(pdfPath); // Default: UUID.pdf

        // Rename if custom_name is provided
        if (custom_name && custom_name.trim().length > 0) {
            const safeName = sanitizeFilename(custom_name);
            if (safeName) {
                const newFilename = `${safeName}.pdf`;
                const newPdfPath = path.join(OUTPUT_DIR, newFilename);

                // Rename (overwrite if exists)
                fs.renameSync(pdfPath, newPdfPath);
                filename = newFilename;
            }
        }

        // Update Record
        record.status = 'success';
        record.pdf_file = filename;
        saveHistory(record);

        res.json({
            status: "success",
            filename,
            tex_content: generatedTex,
            run_id: runId
        });
    } catch (e) {
        console.error("❌ PDF Compilation Failed:", e.message);

        // Update Record with Error
        record.status = 'failed';
        record.error = e.message;
        saveHistory(record);

        // Return the LaTeX anyway so user can save it
        res.status(200).json({
            status: "partial_success", // 200 OK because we have the LaTeX
            detail: "PDF Compilation failed, but LaTeX was generated.",
            error: e.message,
            tex_content: generatedTex,
            run_id: runId
        });
    }
});

app.get('/download/:filename', (req, res) => {
    const filePath = path.join(OUTPUT_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ detail: "File not found" });
    }
});

// Serve Static Frontend (for Docker/Production)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve React App
app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(frontendPath)) {
        res.sendFile(frontendPath);
    } else {
        res.status(404).send("Frontend built files not found. Run 'npm run build' in frontend directory.");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Data Directory: ${DATA_DIR}`);
});
