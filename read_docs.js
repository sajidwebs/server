const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');

async function extractTextFromDocx(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

async function main() {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx'));
    files.push('system set up.docx');
    
    for (const file of files) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`\n========== ${file} ==========\n`);
            const text = await extractTextFromDocx(filePath);
            if (text) {
                console.log(text);
            }
        }
    }
}

main().catch(console.error);