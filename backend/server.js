const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { generateResumeContent, getAvailableModels } = require('./services/llm');
const { compilePdf } = require('./services/pdf');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const OUTPUT_DIR = path.join(DATA_DIR, 'resumes');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
if (!fs.existsSync(HISTORY_PATH)) fs.writeFileSync(HISTORY_PATH, '[]');

const getHistory = () => {
    try {
        return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    } catch (e) { return []; }
};

const saveHistory = (record) => {
    const history = getHistory();
    history.unshift(record);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
};

const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9_\-\s]/gi, '').replace(/\s+/g, '_');
};

const ensureUniqueFilename = (dir, baseName, ext) => {
    let candidate = `${baseName}${ext}`;
    let suffix = 1;
    while (fs.existsSync(path.join(dir, candidate))) {
        candidate = `${baseName}_${suffix}${ext}`;
        suffix += 1;
    }
    return candidate;
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

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.get('/models', async (req, res) => {
    const models = await getAvailableModels();
    res.json({ models });
});

app.get('/templates', (req, res) => {
    try {
        const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.tex'));
        const previewMap = {
            'classic.tex': '/previews/classic.png',
            'modern.tex': '/previews/modern.png',
            'minimalistic.tex': '/previews/minimal.png',
            'two_column.tex': '/previews/two_column.png',
            'sidebar.tex': '/previews/sidebar.png',
            'sidebarleft.tex': '/previews/sidebarleft.png',
            'rows.tex': '/previews/rows.png',
            'infographics.tex': '/previews/infographics.png',
            'infographics2_en.tex': '/previews/infographics2_en.png',
            'infographics2.tex': '/previews/infographics2_en.png'
        };
        const templateData = files.map(filename => ({
            id: filename,
            name: filename.replace('.tex', '').replace(/_/g, ' ').toUpperCase(),
            preview: previewMap[filename] || null
        }));
        res.json({ templates: templateData });
    } catch (e) {
        res.status(500).json({ detail: "Error listing templates" });
    }
});

app.get('/history', (req, res) => res.json({ history: getHistory() }));

app.post('/generate', async (req, res) => {
    console.log("\n📝 New Resume Generation Request");
    const { job_description, template_name, custom_name, instructions, model, profile_data } = req.body || {};

    if (!job_description || !job_description.trim()) {
        return res.status(400).json({ detail: "job_description is required." });
    }

    let profileContent = "";
    if (profile_data && typeof profile_data === 'object' && Object.keys(profile_data).length > 0) {
        console.log("👤 Using profile data provided by client");
        profileContent = formatProfileForPrompt(profile_data);
    } else if (fs.existsSync(PROFILE_PATH)) {
        console.log("📁 Falling back to server-side profile.json");
        try {
            const profileData = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
            profileContent = formatProfileForPrompt(profileData);
        } catch (e) {
            return res.status(500).json({ detail: "Error reading profile data." });
        }
    } else {
        return res.status(400).json({ detail: "Profile not found. Please fill out your profile first." });
    }

    const templatePath = path.join(TEMPLATES_DIR, template_name || 'template.tex');
    let templateStyle = "";
    if (fs.existsSync(templatePath)) {
        templateStyle = fs.readFileSync(templatePath, 'utf-8');
    }

    const generatedTex = await generateResumeContent(profileContent, job_description, templateStyle, instructions, model);
    if (!generatedTex) return res.status(500).json({ detail: "AI generation failed." });

    const runId = uuidv4();
    const tempTexPath = path.join(OUTPUT_DIR, `${runId}.tex`);
    fs.writeFileSync(tempTexPath, generatedTex, 'utf-8');

    const record = {
        id: runId,
        timestamp: new Date().toISOString(),
        name: (custom_name && custom_name.trim()) || job_description.substring(0, 30) + "...",
        template: template_name,
        status: 'pending',
        tex_file: `${runId}.tex`,
        pdf_file: null,
        error: null
    };

    try {
        const pdfPath = await compilePdf(tempTexPath, OUTPUT_DIR);
        let filename = path.basename(pdfPath);

        if (custom_name && custom_name.trim()) {
            const safeName = sanitizeFilename(custom_name);
            const newFilename = ensureUniqueFilename(OUTPUT_DIR, safeName, '.pdf');
            fs.renameSync(pdfPath, path.join(OUTPUT_DIR, newFilename));
            filename = newFilename;
        }

        record.status = 'success';
        record.pdf_file = filename;
        saveHistory(record);
        res.json({ status: "success", filename, tex_content: generatedTex, run_id: runId });
    } catch (e) {
        record.status = 'failed';
        record.error = e.message;
        saveHistory(record);
        res.json({ status: "partial_success", error: e.message, tex_content: generatedTex, run_id: runId });
    }
});

app.get('/download/:filename', (req, res) => {
    const requested = path.basename(req.params.filename || '');
    const filePath = path.join(OUTPUT_DIR, requested);
    if (fs.existsSync(filePath)) res.download(filePath);
    else res.status(404).json({ detail: "File not found" });
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
    const index = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(index)) res.sendFile(index);
    else res.status(404).send("Frontend not found.");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
});
