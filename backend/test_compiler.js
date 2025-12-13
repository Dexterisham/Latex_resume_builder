const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'test_output');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);

const texFile = path.join(testDir, 'hello.tex');
const texContent = `
\\documentclass{article}
\\begin{document}
Hello World! MikTeX is working.
\\end{document}
`;

fs.writeFileSync(texFile, texContent);

console.log("🔨 Spawning pdflatex on hello.tex...");

const pdflatex = spawn('pdflatex', [
    '-output-directory', testDir,
    '-interaction=nonstopmode',
    texFile
]);

pdflatex.stdout.on('data', d => process.stdout.write(d));
pdflatex.stderr.on('data', d => process.stderr.write(d));

pdflatex.on('close', (code) => {
    console.log(`\n\nProcess exited with code ${code}`);
    if (code === 0) {
        console.log(`✅ Success! PDF created at: ${path.join(testDir, 'hello.pdf')}`);
    } else {
        console.log("❌ Failed.");
    }
});
