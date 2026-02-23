#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { program } = require('commander');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

// Optimization: Remove SDK, use shared client + caching (Cycle #0063)
const { getToken, fetchWithRetry } = require('../feishu-common/index.js');

const IMAGE_KEY_CACHE_FILE = path.resolve(__dirname, '../../memory/feishu_image_keys.json');

const https = require('https');
const http = require('http');

async function downloadImage(url) {
    const tempFile = path.resolve(__dirname, `../../temp/feishu-image-${Date.now()}.png`);
    const file = fs.createWriteStream(tempFile);
    const protocol = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
        protocol.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(() => resolve(tempFile));
            });
        }).on('error', function(err) {
            fs.unlink(tempFile, () => {}); 
            reject(err);
        });
    });
}

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
        console.log(`Using cached image key (Hash: ${fileHash.substring(0,8)})`);
        return cache[fileHash];
    }

    // 2. Upload
    console.log(`Uploading image: ${path.basename(filePath)}...`);
    
    // Fix: form-data/fetch compatibility
    // Node.js 'fetch' uses a different FormData implementation than browser/axios
    // To be robust, we construct the multipart body manually or use the standard FormData global if available in Node 18+
    
    const formData = new FormData();
    formData.append('image_type', 'message');
    
    // In Node.js environment, File/Blob support in FormData might be limited or require specific types
    // Using a Blob with type is the standard way
    const blob = new Blob([fileBuffer], { type: 'application/octet-stream' });
    formData.append('image', blob, path.basename(filePath));

    // IMPORTANT: Do NOT set Content-Type header manually for FormData, let fetch handle the boundary
    const res = await fetchWithRetry('https://open.feishu.cn/open-apis/im/v1/images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Content-Type is auto-set
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
    
    console.log(`Sending image message to ${target}...`);
    
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

module.exports = { sendImageMessage, uploadImage };

if (require.main === module) {
    program
      .option('--target <id>', 'Target Chat/User ID')
      .option('--image <path>', 'Image file path')
      .option('--file <path>', 'File (alias for --image)')
      .option('--url <url>', 'Image URL to download and send')
      .parse(process.argv);

    const options = program.opts();

    (async () => {
        if (options.file && !options.image) options.image = options.file;

        if (!options.target || (!options.image && !options.url)) {
            console.error('Usage: node send.js --target <id> [--image <path> | --url <url>]');
            process.exit(1);
        }

        let filePath;
        let tempFile;

        if (options.url) {
            try {
                console.log(`Downloading image from ${options.url}...`);
                tempFile = await downloadImage(options.url);
                filePath = tempFile;
            } catch (e) {
                console.error('Error downloading image:', e.message);
                process.exit(1);
            }
        } else {
            filePath = path.resolve(options.image);
            if (!fs.existsSync(filePath)) {
                console.error('File not found:', filePath);
                process.exit(1);
            }
        }

        try {
            await sendImageMessage(options.target, filePath);
            if (tempFile) {
                fs.unlinkSync(tempFile);
            }
        } catch (e) {
            console.error('Error:', e.message);
            if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            process.exit(1);
        }
    })();
}
