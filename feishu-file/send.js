#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

// Optimization: Use shared client and native FormData (Cycle #0061)
const { getToken, fetchWithRetry } = require('../feishu-common/index.js');

const https = require('https');
const http = require('http');

async function downloadTempFile(url) {
    const fileName = path.basename(new URL(url).pathname) || `feishu-file-${Date.now()}.tmp`;
    const tempFile = path.resolve(__dirname, `../../temp/${fileName}`);
    const file = fs.createWriteStream(tempFile);
    const protocol = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
        const req = protocol.get(url, function(response) {
            if (response.statusCode !== 200) {
                fs.unlink(tempFile, () => {});
                reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', function() {
                file.close(() => resolve(tempFile));
            });
        });
        
        req.on('error', function(err) {
            fs.unlink(tempFile, () => {}); 
            reject(err);
        });
    });
}

async function uploadFile(token, filePath) {
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    
    // Validate size (30MB limit for IM API)
    if (fileSize > 30 * 1024 * 1024) {
        throw new Error(`File too large (${(fileSize / 1024 / 1024).toFixed(2)} MB). Max 30MB allowed.`);
    }

    console.log(`Uploading ${fileName} (${fileSize} bytes)...`);
    
    // Note: Node.js 18+ supports global FormData and Blob
    // fs.readFileSync returns Buffer. We can create a Blob from it.
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append('file_type', 'stream'); // 'stream' is typical for generic files
    formData.append('file_name', fileName);
    formData.append('file', blob, fileName);

    const res = await fetchWithRetry('https://open.feishu.cn/open-apis/im/v1/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
    });
    
    const data = await res.json();
    
    if (data.code !== 0) {
        throw new Error(`Upload API Error ${data.code}: ${data.msg}`);
    }
    
    return data.data.file_key;
}

async function sendFileMessage(target, filePath) {
    const token = await getToken();
    const fileSize = fs.statSync(filePath).size;
    
    // Auto-split logic for files > 30MB
    if (fileSize > 30 * 1024 * 1024) {
        console.warn(`File is too large (${(fileSize / 1024 / 1024).toFixed(2)} MB). Auto-splitting into 29MB chunks...`);
        const partPrefix = `${filePath}.part`;
        try {
            // Split into 29MB chunks
            execSync(`split -b 29m "${filePath}" "${partPrefix}"`);
            
            // Find generated parts
            const dir = path.dirname(filePath);
            const baseName = path.basename(partPrefix);
            const parts = fs.readdirSync(dir)
                .filter(f => f.startsWith(baseName))
                .sort()
                .map(f => path.join(dir, f));
            
            console.log(`Split into ${parts.length} parts. Uploading sequentially...`);
            
            let partCount = 0;
            for (const part of parts) {
                // Send each part (recursive call handles upload + send)
                await sendFileMessage(target, part);
                partCount++;
                
                // Cleanup part file
                fs.unlinkSync(part);
            }
            
            // Send instruction message
            const receiveIdType = target.startsWith('oc_') ? 'chat_id' : 'open_id';
            const instruction = `File "${path.basename(filePath)}" was split into ${parts.length} parts due to size limit. Merge with: cat ${path.basename(partPrefix)}* > "${path.basename(filePath)}"`;
            
            await fetchWithRetry(
                `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        receive_id: target,
                        msg_type: 'text',
                        content: JSON.stringify({ text: instruction })
                    })
                }
            );
            
            return { split: true, parts: parts.length };
        } catch (err) {
            throw new Error(`Auto-split failed: ${err.message}`);
        }
    }
    
    // Normal upload for small files or split parts
    const fileKey = await uploadFile(token, filePath);
    console.log(`File uploaded. Key: ${fileKey}`);
    
    const receiveIdType = target.startsWith('oc_') ? 'chat_id' : 'open_id';
    
    const messageBody = {
        receive_id: target,
        msg_type: 'file',
        content: JSON.stringify({ file_key: fileKey })
    };
    
    console.log(`Sending file message to ${target}...`);
    
    const res = await fetchWithRetry(
        `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(messageBody)
        }
    );
    
    const data = await res.json();
    
    if (data.code !== 0) {
        throw new Error(`Send API Error ${data.code}: ${data.msg}`);
    }
    
    console.log('✅ Sent successfully!', data.data.message_id);
    return data.data;
}

module.exports = { sendFileMessage, uploadFile };

if (require.main === module) {
    program
      .option('--target <id>', 'Target Chat/User ID')
      .option('--file <path>', 'File path')
      .option('--url <url>', 'File URL to download and send')
      .argument('[file]', 'File path')
      .allowExcessArguments(true) // Allow positional args to prevent "too many arguments" error
      .parse(process.argv);

    const options = program.opts();

    // Support positional file argument if --file is missing
    if (!options.file && program.args.length > 0) {
        options.file = program.args[0];
    }

    (async () => {
        if (!options.target || (!options.file && !options.url)) {
            console.error('Usage: node send.js --target <id> [--file <path> | --url <url>]');
            process.exit(1);
        }
        
        let filePath;
        let tempFile;

        if (options.url) {
            try {
                console.log(`Downloading file from ${options.url}...`);
                tempFile = await downloadTempFile(options.url);
                filePath = tempFile;
            } catch (e) {
                console.error('Error downloading file:', e.message);
                process.exit(1);
            }
        } else {
            filePath = path.resolve(options.file);
            if (!fs.existsSync(filePath)) {
                console.error('File not found:', filePath);
                process.exit(1);
            }
        }

        try {
            await sendFileMessage(options.target, filePath);
            if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch (e) {
            console.error('Error:', e.message);
            if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            process.exit(1);
        }
    })();
}
