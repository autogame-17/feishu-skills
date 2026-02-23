const { uploadImage } = require('./send.js');
const { getToken, fetchWithAuth } = require('../feishu-common');

async function main() {
  const args = process.argv.slice(2);
  const type = args[0]; // upload, send
  
  if (!type) {
    console.log('Usage: node skills/feishu-image/index.js <action> [args]');
    console.log('Actions: upload <path>, send <image_key> <target_id> <target_type>');
    return;
  }

  try {
    if (type === 'upload') {
      const filePath = args[1];
      if (!filePath) throw new Error('Missing file path');
      
      const token = await getToken();
      const imageKey = await uploadImage(token, filePath);
      console.log(JSON.stringify({ status: 'success', image_key: imageKey }));
      
    } else if (type === 'send') {
      // Usage: node index.js send <image_key> <target_id> [target_type]
      const imageKey = args[1];
      const targetId = args[2];
      const targetType = args[3] || 'open_id';
      
      if (!imageKey || !targetId) throw new Error('Missing image_key or target_id');
      
      const receiveIdType = targetId.startsWith('oc_') ? 'chat_id' : targetType;
      
      const res = await fetchWithAuth(
        `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receive_id: targetId,
            msg_type: 'image',
            content: JSON.stringify({ image_key: imageKey })
          })
        }
      );
      
      const data = await res.json();
      if (data.code !== 0) throw new Error(`Send API Error ${data.code}: ${data.msg}`);
      console.log(JSON.stringify({ status: 'success', message: 'Image sent', data: data.data }));

    } else {
      throw new Error(`Unknown action: ${type}`);
    }
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', error: error.message }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
