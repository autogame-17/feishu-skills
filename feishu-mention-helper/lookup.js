const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper to get tenant access token (reusing common pattern)
async function getTenantAccessToken() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('FEISHU_APP_ID or FEISHU_APP_SECRET not set');
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
          if (json.code !== 0) reject(new Error(`Auth failed: ${json.msg}`));
          else resolve(json.tenant_access_token);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify({ app_id: appId, app_secret: appSecret }));
    req.end();
  });
}

// Search users
async function searchUsers(token, query) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: `/open-apis/contact/v3/users/search?query=${encodeURIComponent(query)}&page_size=5`,
      method: 'POST', // Search is often POST or GET depending on specific endpoint version, v3 search is POST usually? Checking docs... actually /search/v3/users is deprecated, use standard list or specific search. 
      // Let's use the standard user search API: POST /open-apis/search/v2/data_source (complex).
      // Easier: GET /open-apis/contact/v3/users?user_id_type=open_id (requires iterating).
      // Actually, standard contact search: POST /open-apis/search/v1/user (Legacy) or new integration.
      // Let's try the safer "search users" endpoint: POST /open-apis/contact/v3/users/search (Wait, this requires specific permissions).
      
      // ALTERNATIVE: Use the group members list if we know the chat_id. 
      // Since the user complaint was about a specific group, listing group members is safer and more likely to succeed for bots in the same group.
      // But we need a general lookup.
      
      // Let's stick to a simple strategy: Try to read from identity-manager first, if not found, fail gracefully or ask user.
      // BUT this is an innovation to FIX it. 
      
      // Let's implement "list group members" as the primary discovery mechanism, as bots are often in the same group.
      // GET /open-apis/im/v1/chats/:chat_id/members
      
      // We need a chat_id. If not provided, we can't easily find context.
      // BUT the tool is "lookup".
      
      // Let's try to search via the basic user search if available.
      // POST /open-apis/contact/v3/users/search is for contacts.
      
      // Let's assume we want to solve the "group chat mention" issue.
      // We will build a tool that accepts a chat_id and a name, and finds the open_id in that chat.
      
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) { reject(e); }
      });
    });
    
    // Fallback: If we can't search globally, we just return empty.
    req.on('error', reject);
    req.write(JSON.stringify({ query: query }));
    req.end();
  });
}

async function getChatMembers(token, chatId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: `/open-apis/im/v1/chats/${chatId}/members?member_id_type=open_id`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code !== 0) {
             // If chat not found or no perm, resolve null
             resolve(null);
          } else {
             resolve(json.data.items);
          }
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', (e) => resolve(null));
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  let name = '';
  let chatId = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name') name = args[i+1];
    if (args[i] === '--chat-id') chatId = args[i+1];
  }

  if (!name) {
    console.log(JSON.stringify({ error: "Missing --name" }));
    return;
  }

  try {
    const token = await getTenantAccessToken();
    let found = null;

    // 1. If chat_id provided, search there first (highest relevance)
    if (chatId) {
      const members = await getChatMembers(token, chatId);
      if (members) {
        found = members.find(m => m.name === name);
      }
    }

    // 2. If not found, try contact search (if scoped) - implementing strict search to avoid spamming
    // Skipping global search for now to keep blast radius low and permissions safe.

    if (found) {
        const result = {
            name: found.name,
            open_id: found.member_id, // member_id is open_id in chat members API
            mention: `<at user_id="${found.member_id}">${found.name}</at>`
        };
        
        // Output JSON for the agent
        console.log(JSON.stringify(result, null, 2));
        
        // Optional: Update identity-manager via shared library
        try {
            const IdentityManager = require('../identity-manager/index.js');
            // Check if user exists first to avoid overwriting with partial info?
            // registerUser(id, name, role, alias)
            // We only have name and open_id here.
            IdentityManager.registerUser(found.member_id, found.name, "User (Auto-Resolved)", found.en_name || "");
            console.error(`[INFO] Cached ${name} to identity-manager`);
        } catch (e) {
            console.error(`[WARN] Failed to update identity cache: ${e.message}`);
        }
    } else {
        console.log(JSON.stringify({ error: "User not found in specified context" }));
    }

  } catch (error) {
    console.log(JSON.stringify({ error: error.message }));
  }
}

main();
