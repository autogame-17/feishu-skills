#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { program } = require('commander');
const { execSync } = require('child_process');

program
  .option('-t, --target <id>', 'Target User/Chat ID')
  .option('-x, --text <text>', 'Text content')
  .option('-c, --content <text>', 'Content (alias for --text)')
  .option('-f, --text-file <path>', 'Path to text file')
  .option('-p, --persona <type>', 'Persona mode (default, green-tea, mad-dog, d-guide)')
  .option('--title <text>', 'Title for card/post')
  .parse(process.argv);

const options = program.opts();

// Alias mapping
if (options.content && !options.text) {
    options.text = options.content;
}

// Resolve content
let content = options.text || '';
if (options.textFile) {
    try {
        content = fs.readFileSync(options.textFile, 'utf8');
    } catch (e) {
        console.error(`Failed to read file: ${options.textFile}`);
        process.exit(1);
    }
}

if (!content) {
    console.error('Error: Must provide --text or --text-file');
    process.exit(1);
}

const target = options.target;
if (!target) {
    console.error('Error: Must provide --target');
    process.exit(1);
}

// Helper: Create temp file
function createTempFile(text) {
    const tmpPath = path.join(os.tmpdir(), `smart_reply_${Date.now()}.md`);
    fs.writeFileSync(tmpPath, text);
    return tmpPath;
}

const tempFile = createTempFile(content);
let cmd = '';

try {
    // Decision Logic
    // 1. If persona is specified (and not default), use feishu-card (send_persona.js)
    if (options.persona && options.persona !== 'default') {
        console.log(`[SmartReply] Persona '${options.persona}' detected -> Using Card`);
        cmd = `node skills/feishu-card/send_persona.js --target "${target}" --persona "${options.persona}" --text-file "${tempFile}"`;
    } else {
        // 2. Content Analysis
        const hasCodeBlock = /```[\s\S]*?```/.test(content);
        // Simple check for bracketed text likely emoji (must be Feishu native style [Text])
        const hasFeishuEmoji = /\[(微笑|色|亲亲|大哭|强|加油|.*?)]/.test(content); 

        // Strategy selection
        let strategy = 'post';

        if (hasCodeBlock) {
            strategy = 'card';
        } else if (hasFeishuEmoji) {
            strategy = 'post';
        } else if (content.length > 500) {
            strategy = 'post'; // Long form is safer in Post
        } else {
            strategy = 'post'; // Default to Post (RichText) for natural conversation
        }

        console.log(`[SmartReply] Strategy: ${strategy} (Code: ${hasCodeBlock}, Emoji: ${hasFeishuEmoji})`);

        if (strategy === 'card') {
            cmd = `node skills/feishu-card/send.js --target "${target}" --text-file "${tempFile}"`;
            if (options.title) cmd += ` --title "${options.title}"`;
        } else {
            cmd = `node skills/feishu-post/send.js --target "${target}" --text-file "${tempFile}"`;
            if (options.title) cmd += ` --title "${options.title}"`;
        }
    }

    // Execute
    execSync(cmd, { stdio: 'inherit' });

} catch (e) {
    console.error(`[SmartReply] Error executing command: ${cmd}`);
    process.exit(1);
} finally {
    // Cleanup
    try { fs.unlinkSync(tempFile); } catch(e) {}
}
