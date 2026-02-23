#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');

/**
 * Unified Feishu Toolkit CLI
 * Dispatcher for sub-commands.
 */

const COMMANDS = {
    'send-image': './send-image.js',
    // Future commands:
    // 'send-post': './send-post.js',
    // 'upload-file': './upload-file.js'
};

function showHelp() {
    console.log(`
Feishu Toolkit (v1.0.0)
Usage: node index.js <command> [options]

Commands:
  send-image    Upload and send an image
  
Examples:
  node index.js send-image --target ou_... --file image.png
    `);
}

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
}

if (!COMMANDS[command]) {
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}

// Delegate to sub-script
const scriptPath = path.resolve(__dirname, COMMANDS[command]);
if (!fs.existsSync(scriptPath)) {
    console.error(`Error: Command script not found at ${scriptPath}`);
    process.exit(1);
}

// Pass remaining args to the sub-script
const childArgs = args.slice(1);
require('child_process').fork(scriptPath, childArgs);
