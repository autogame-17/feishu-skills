#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parseArgs } = require('util');

// Load env before anything else (just in case client needs it immediately)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const { getToken, fetchWithRetry } = require('../feishu-common/index.js');

const IMAGE_KEY_CACHE_FILE = path.resolve(__dirname, '../../memory/feishu_image_keys.json');

async function uploadImage(token, filePath) {
    // 1. Check Cache
    let fileBuffer;
    try { fileBuffer = fs.readFileSync(filePath); } catch (e) { throw new Error(`Read file failed: ${e.message}`); }
    
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    
    let cache = {};
    if (fs.existsSync(IMAGE_KEY_CACHE_FILE)) {
        try { cache = JSON.parse(fs.readFileSync(IMAGE_KEY_CACHE_FILE, 'utf8')); } catch (e) {}
    }
    
    if (cache[fileHash]) {
        console.log(`[Cache] Using image key: ${fileHash.substring(0,8)}...`);
        return cache[fileHash];
    }

    // 2. Upload
    console.log(`[Upload] Uploading image: ${path.basename(filePath)}...`);
    
    const formData = new FormData();
    formData.append('image_type', 'message');
    const blob = new Blob([fileBuffer]);
    formData.append('image', blob, path.basename(filePath));

    const res = await fetchWithRetry('https://open.feishu.cn/open-apis/im/v1/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
    
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Upload API Error ${data.code}: ${data.msg}`);
    
    const imageKey = data.data.image_key;
    
    // 3. Update Cache
    cache[fileHash] = imageKey;
    try {
        const cacheDir = path.dirname(IMAGE_KEY_CACHE_FILE);
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(IMAGE_KEY_CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch(e) {}
    
    return imageKey;
}

async function sendImageMessage(target, filePath) {
    const token = await getToken();
    const imageKey = await uploadImage(token, filePath);
    
    const receiveIdType = target.startsWith('oc_') ? 'chat_id' : 'open_id';
    
    const messageBody = {
        receive_id: target,
        msg_type: 'image',
        content: JSON.stringify({ image_key: imageKey })
    };
    
    console.log(`[Send] Sending image to ${target}...`);
    
    const res = await fetchWithRetry(
        `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(messageBody)
        }
    );
    
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Send API Error ${data.code}: ${data.msg}`);
    
    console.log('✅ Sent successfully!', data.data.message_id);
    return data.data;
}

// CLI Logic
if (require.main === module) {
    const options = {
        target: { type: 'string', short: 't' },
        file: { type: 'string', short: 'f' },
        help: { type: 'boolean', short: 'h' }
    };
    
    try {
        const { values } = parseArgs({ options, allowPositionals: true });
        
        if (values.help) {
            console.log(`
Usage: node send-image.js --target <id> --file <path>

Options:
  --target, -t <id>    Target Chat/User ID
  --file, -f <path>    Image file path
  --help, -h           Show help
            `);
            process.exit(0);
        }

        if (!values.target || !values.file) {
            console.error('Error: Missing required arguments: --target and --file');
            console.error('Run with --help for usage.');
            process.exit(1);
        }
        
        const filePath = path.resolve(values.file);
        if (!fs.existsSync(filePath)) {
            console.error('Error: File not found:', filePath);
            process.exit(1);
        }

        (async () => {
            try {
                await sendImageMessage(values.target, filePath);
            } catch (e) {
                console.error('Error:', e.message);
                process.exit(1);
            }
        })();

    } catch (e) {
        console.error('Argument Error:', e.message);
        process.exit(1);
    }
}

module.exports = { sendImageMessage, uploadImage };
