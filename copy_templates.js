import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The user specified latexcv is at C:\Users\mohammed isham\.gemini\antigravity\playground\spatial-cosmos\latexcv
// resume_builder is at C:\Users\mohammed isham\.gemini\antigravity\playground\spatial-cosmos\resume_builder
const srcLatex = path.resolve(__dirname, '..', 'latexcv');
const destTemplates = path.resolve(__dirname, 'backend', 'data', 'templates');
const destPreviews = path.resolve(__dirname, 'frontend', 'public', 'previews');

console.log(`Source LaTeX: ${srcLatex}`);
console.log(`Dest Templates: ${destTemplates}`);
console.log(`Dest Previews: ${destPreviews}`);

// Ensure directories exist
if (!fs.existsSync(destTemplates)) fs.mkdirSync(destTemplates, { recursive: true });
if (!fs.existsSync(destPreviews)) fs.mkdirSync(destPreviews, { recursive: true });

// Copy Templates
const templates = {
    'classic': 'classic/main.tex',
    'modern': 'modern/main.tex',
    'minimalistic': 'minimalistic/main.tex',
    'two_column': 'two_column/main.tex',
    'sidebar': 'sidebar/main.tex',
    'sidebarleft': 'sidebarleft/main.tex',
    'rows': 'rows/main.tex',
    'infographics': 'infographics/main.tex',
    'infographics2': 'infographics2/en/main.tex'
};

for (const [name, relPath] of Object.entries(templates)) {
    const srcPath = path.join(srcLatex, relPath);
    const destPath = path.join(destTemplates, `${name}.tex`);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copied ${name}.tex`);
    } else {
        console.error(`✗ Not found: ${srcPath}`);
    }
}

// Copy logo.svg for modern template
const logoSrc = path.join(srcLatex, 'logo.svg');
const logoDest = path.join(destTemplates, 'logo.svg');
if (fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, logoDest);
    console.log(`✓ Copied logo.svg`);
}

// Ensure the logo.svg is also in the resumes directory so it works during compilation
const resumesDir = path.resolve(__dirname, 'backend', 'data', 'resumes');
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });
if (fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, path.join(resumesDir, 'logo.svg'));
}

// Copy preview images
const mediaDir = path.join(srcLatex, 'docs', 'media');
if (fs.existsSync(mediaDir)) {
    const files = fs.readdirSync(mediaDir);
    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.svg') || file.endsWith('.jpg')) {
            fs.copyFileSync(path.join(mediaDir, file), path.join(destPreviews, file));
            console.log(`✓ Copied preview: ${file}`);
        }
    }
} else {
    console.error(`✗ Media dir not found: ${mediaDir}`);
}

console.log("\nDone! All assets processed.");
