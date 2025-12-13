const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const compilePdf = (texFilePath, outputDir) => {
    return new Promise((resolve, reject) => {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`🔨 Compiling PDF: ${path.basename(texFilePath)}`);

        // Spawn the pdflatex process
        const pdflatex = spawn('pdflatex', [
            '-output-directory', outputDir,
            '-interaction=nonstopmode',
            texFilePath
        ]);

        let stdout = '';
        let stderr = '';

        pdflatex.stdout.on('data', (data) => stdout += data.toString());
        pdflatex.stderr.on('data', (data) => stderr += data.toString());

        pdflatex.on('close', (code) => {
            if (code === 0) {
                const pdfFilename = path.basename(texFilePath, '.tex') + '.pdf';
                const pdfPath = path.join(outputDir, pdfFilename);
                console.log(`✅ Compilation success: ${pdfFilename}`);
                resolve(pdfPath);
            } else {
                console.error(`❌ Compilation failed (Exit Code: ${code})`);
                console.error("--- LaTeX Output (Tail) ---");
                console.error(stdout.slice(-500)); // Show last 500 chars of logs
                reject(new Error(`PDF Compilation failed. Exit code ${code}`));
            }
        });

        pdflatex.on('error', (err) => {
            console.error("❌ Failed to start pdflatex process.");
            console.error("   Is MikTeX installed and in your system PATH?");
            reject(new Error(`Failed to start pdflatex: ${err.message}`));
        });
    });
};

module.exports = { compilePdf };
