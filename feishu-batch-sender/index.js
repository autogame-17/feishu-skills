const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { fetchWithAuth } = require('../feishu-common/feishu-client');

program
  .option('-t, --target <id>', 'Target user ID (ou_...) or chat ID (oc_...)')
  .option('-m, --messages <json>', 'JSON array of messages (strings or objects)')
  .option('-f, --file <path>', 'JSON file containing messages array')
  .option('--delay <ms>', 'Delay between messages in ms', '500')
  .parse(process.argv);

const options = program.opts();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    let targetId = options.target;
    let messages = [];

    if (options.messages) {
      try {
        messages = JSON.parse(options.messages);
      } catch (e) {
        // Handle unquoted string if simple text
        if (!options.messages.startsWith('[')) {
           messages = [options.messages];
        } else {
           throw new Error(`Invalid JSON in --messages: ${e.message}`);
        }
      }
    } else if (options.file) {
      const content = fs.readFileSync(options.file, 'utf8');
      messages = JSON.parse(content);
    } else {
      console.error('Error: Missing --messages or --file');
      process.exit(1);
    }

    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    if (!targetId) {
       // Try to infer from environment or default? No, strict requirement.
       console.error('Error: Missing --target');
       process.exit(1);
    }

    console.log(`Sending ${messages.length} messages to ${targetId}...`);
    
    const results = [];
    const delayMs = parseInt(options.delay, 10) || 500;

    for (const [index, msg] of messages.entries()) {
      let msgType = 'text';
      let content = '';

      if (typeof msg === 'string') {
        msgType = 'text';
        content = JSON.stringify({ text: msg });
      } else if (typeof msg === 'object') {
        if (msg.type) msgType = msg.type;
        
        if (msgType === 'text') {
          content = JSON.stringify({ text: msg.content || msg.text });
        } else if (msgType === 'post') {
          content = JSON.stringify(msg.content); 
          // Note: post content is complex structure. If user passes object, stringify it.
        } else if (msgType === 'image') {
          content = JSON.stringify({ image_key: msg.image_key });
        } else if (msgType === 'interactive') {
          content = JSON.stringify(msg.card || msg.content);
        } else {
          // Fallback generic content
          content = JSON.stringify(msg.content || msg);
        }
      }

      const receiveIdType = targetId.startsWith('oc_') ? 'chat_id' : 'open_id';
      const url = `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`;
      
      try {
        const response = await fetchWithAuth(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receive_id: targetId,
            msg_type: msgType,
            content: content
          })
        });

        const data = await response.json();
        
        if (data.code !== 0) {
          console.error(`[Message ${index+1}] Failed: ${data.msg} (code ${data.code})`);
          results.push({ index, status: 'failed', error: data.msg });
        } else {
          console.log(`[Message ${index+1}] Sent: ${data.data.message_id}`);
          results.push({ index, status: 'success', id: data.data.message_id });
        }

      } catch (err) {
        console.error(`[Message ${index+1}] Network Error: ${err.message}`);
        results.push({ index, status: 'error', error: err.message });
      }

      if (index < messages.length - 1) {
        await sleep(delayMs);
      }
    }

    // Summary
    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`Batch complete: ${successCount}/${messages.length} sent successfully.`);
    
    if (successCount < messages.length) {
      process.exit(1); // Indicate partial failure
    }

  } catch (error) {
    console.error(`Fatal Error: ${error.message}`);
    process.exit(1);
  }
}

main();
