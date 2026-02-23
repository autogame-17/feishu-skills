const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper to get Feishu Tenant Access Token (Internal)
// In a real OpenClaw env, this might reuse a shared token manager.
// For simplicity and robustness, we implement a basic fetcher using env vars.
async function getTenantAccessToken() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET in environment.');
  }

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0) resolve(json.tenant_access_token);
          else reject(new Error(`Token Error: ${json.msg}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ app_id: appId, app_secret: appSecret }));
    req.end();
  });
}

// Generic Feishu API Request
async function feishuRequest(method, endpoint, body = null) {
  const token = await getTenantAccessToken();
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.feishu.cn',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0) resolve(json.data);
          else reject(new Error(`API Error [${json.code}]: ${json.msg}`));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// --- Actions ---

async function createTask(args) {
  const summary = args.summary;
  if (!summary) throw new Error('Missing --summary');

  // v2 Tasks API: POST /open-apis/task/v2/tasks
  // https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/task-v2/task/create
  const payload = {
    summary: summary,
    description: args.description || '',
    due: args.due ? { timestamp: String(new Date(args.due).getTime()) } : undefined,
    origin: { platform_i18n_name: JSON.stringify({ "zh_cn": args.origin || "OpenClaw" }) }
  };

  if (args.user_id) {
    payload.members = [{ id: args.user_id, type: 'user' }];
  }

  const result = await feishuRequest('POST', '/open-apis/task/v2/tasks', payload);
  console.log(JSON.stringify({ status: 'success', task: result.task }));
}

async function completeTask(args) {
  const taskId = args.task_id;
  if (!taskId) throw new Error('Missing --task_id');

  // POST /open-apis/task/v2/tasks/:task_guid/complete
  const result = await feishuRequest('POST', `/open-apis/task/v2/tasks/${taskId}/complete`);
  console.log(JSON.stringify({ status: 'success', result }));
}

async function deleteTask(args) {
  const taskId = args.task_id;
  if (!taskId) throw new Error('Missing --task_id');

  // DELETE /open-apis/task/v2/tasks/:task_guid
  const result = await feishuRequest('DELETE', `/open-apis/task/v2/tasks/${taskId}`);
  console.log(JSON.stringify({ status: 'success', result }));
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const parsedArgs = {};
  
  for (let i = 1; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      parsedArgs[args[i].replace(/^--/, '')] = args[i + 1];
    }
  }

  try {
    switch (command) {
      case 'create':
        await createTask(parsedArgs);
        break;
      case 'complete':
        await completeTask(parsedArgs);
        break;
      case 'delete':
        await deleteTask(parsedArgs);
        break;
      default:
        // If required as a module, export functions
        if (require.main !== module) return;
        console.log('Usage: node index.js [create|complete|delete] --arg val ...');
        break;
    }
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exit(1);
  }
}

// Allow importing
module.exports = { main, createTask, completeTask, deleteTask };

if (require.main === module) {
  main();
}
