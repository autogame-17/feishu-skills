#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

try {
    const script = path.join(__dirname, 'index.js');
    console.log(`Running RSS check...`);
    execSync(`node "${script}" check`, { stdio: 'inherit' });
} catch (e) {
    console.error('RSS Check Failed:', e.message);
    process.exit(1);
}
