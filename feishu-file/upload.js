#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { uploadFile } = require('./send.js');

// Standalone upload script (Cycle #1648)
// Extracts upload logic to return file_key without sending a message.

async function main() {
    program
      .option('--file <path>', 'File path to upload')
      .allowExcessArguments(true) // Allow positional args to prevent "too many arguments" error
      .parse(process.argv);

    const options = program.opts();

    // Support positional file argument if --file is missing
    if (!options.file && program.args.length > 0) {
        options.file = program.args[0];
    }

    if (!options.file) {
        console.error('Usage: node skills/feishu-file/upload.js --file <path>');
        process.exit(1);
    }

    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
        console.error('Error: File not found:', filePath);
        process.exit(1);
    }

    try {
        // Reuse the upload logic from send.js (which handles token and FormData)
        // We need to import getToken locally if send.js doesn't export it, 
        // but send.js exports { sendFileMessage, uploadFile }.
        // uploadFile signature: async function uploadFile(token, filePath)
        
        // We need to get the token here since uploadFile expects it.
        const { getToken } = require('../feishu-common/index.js');
        const token = await getToken();

        const fileKey = await uploadFile(token, filePath);
        
        // Output JSON for tool parsing
        console.log(JSON.stringify({
            status: "success",
            file_key: fileKey,
            file_path: filePath
        }));

    } catch (e) {
        console.error(JSON.stringify({
            status: "error",
            error: e.message
        }));
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
