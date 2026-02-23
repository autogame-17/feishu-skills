#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { pipeline } = require('stream/promises');
const { Readable } = require('stream');

// Import robust shared client (Deduplication & Reliability)
// Preferred dependency: feishu-common
let getToken;
try {
    const client = require('../feishu-common/index.js');
    getToken = client.getToken;
} catch (e) {
    console.error('Dependency Missing: feishu-common (../feishu-common/index.js)');
    process.exit(1);
}

program
  .option('--message-id <id>', 'Message ID containing the file')
  .option('--file-key <key>', 'File Key')
  .option('--output <path>', 'Output file path')
  .option('--type <type>', 'Resource Type (image/file)', 'image')
  .allowExcessArguments(true)
  .parse(process.argv);

const options = program.opts();
const MAX_RETRIES = 3;

async function downloadFile(url, outputPath, attempt = 1) {
    console.log(`Downloading (Attempt ${attempt}/${MAX_RETRIES})...`);
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {
        const token = await getToken();
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
             const msg = await res.text();
             throw new Error(`HTTP ${res.status}: ${msg.slice(0, 200)}`);
        }

        const fileStream = fs.createWriteStream(outputPath);
        // Node.js 18+ fetch returns a WebStream. Convert to Node Stream for pipeline.
        const nodeStream = Readable.fromWeb(res.body);
        
        await pipeline(nodeStream, fileStream);
        
        console.log(`✅ Downloaded to ${outputPath}`);

    } catch (e) {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); // Clean up partial
        console.error(`Download error: ${e.message}`);
        
        if (attempt < MAX_RETRIES) {
             const delay = 2000 * attempt;
             console.log(`Retrying in ${delay/1000}s...`);
             await new Promise(r => setTimeout(r, delay));
             return downloadFile(url, outputPath, attempt + 1);
        }
        throw e;
    }
}

async function run() {
    // Validation: message-id is optional for 'file', required for 'image'
    if (!options.fileKey || !options.output) {
        console.error('Usage: node download.js [--message-id <id>] --file-key <key> --output <path> --type <file|image>');
        process.exit(1);
    }
    
    if (options.type !== 'file' && !options.messageId) {
         console.error('Error: --message-id is required for resource/image downloads.');
         process.exit(1);
    }

    try {
        console.log(`[Feishu-File] Initializing download for ${options.fileKey} (Type: ${options.type})...`);
        
        // Construct URL
        let url;
        if (options.messageId) {
            // Get Resource from Message (Context-aware, works for received files)
            const typeParam = options.type ? `?type=${options.type}` : '';
            url = `https://open.feishu.cn/open-apis/im/v1/messages/${options.messageId}/resources/${options.fileKey}${typeParam}`;
        } else {
            // Direct File Access (Usually for bot-uploaded files)
            url = `https://open.feishu.cn/open-apis/im/v1/files/${options.fileKey}`;
        }
        
        await downloadFile(url, options.output);
        
    } catch (e) {
        console.error('❌ Download Job Failed:', e.message);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}
