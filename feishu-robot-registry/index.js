const { fetchWithAuth, getToken } = require('../feishu-common/index.js');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'registry_config.json');

// --- Helper: Get/Create Registry Doc ---
async function getRegistryDoc(accessToken) {
    // 1. Check local config
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            if (config.doc_token) return config.doc_token;
        } catch (e) {}
    }

    // 2. Search for existing doc (simplified search)
    // NOTE: Search API requires specific permissions. If fails, fallback to create.
    try {
        const searchRes = await fetchWithAuth('https://open.feishu.cn/open-apis/suite/docs-api/search/object', {
            method: 'POST',
            body: JSON.stringify({ 
                search_key: "Robot Contact List", 
                count: 1, 
                type: "docx",
                owner_ids: [] // Search global if possible? Usually scoped to user.
            })
        });
        const searchData = await searchRes.json();
        if (searchData.data?.docs?.length > 0) {
            const docToken = searchData.data.docs[0].token;
            saveConfig(docToken);
            return docToken;
        }
    } catch (e) {
        // Search failed or no permission, proceed to create
    }

    // 3. Create new doc
    const createRes = await fetchWithAuth('https://open.feishu.cn/open-apis/docx/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "Robot Contact List (机器人通讯录)" })
    });
    const createData = await createRes.json();
    if (createData.code !== 0) throw new Error(`Create doc failed: ${createData.msg}`);
    
    const newDocToken = createData.data.document.document_id;
    saveConfig(newDocToken);
    
    // Initialize header
    await appendBlock(newDocToken, accessToken, [
        { block_type: 3, heading1: { elements: [{ text_run: { content: "Registered Robots" } }] } }, // H1
        { block_type: 31, table: { property: { row_size: 1, column_size: 4 }, children: ["row1"] } } // Table placeholder (complex to create via API)
    ]);
    // Note: Creating tables via API is complex. Using bullet list for simplicity.
    
    return newDocToken;
}

function saveConfig(token) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ doc_token: token }, null, 2));
}

// --- Helper: Append Block ---
async function appendBlock(docToken, accessToken, children) {
    const res = await fetchWithAuth(`https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ children })
    });
    return res.json();
}

async function registerRobot(options) {
    const accessToken = await getToken();
    const docToken = options.docToken || await getRegistryDoc(accessToken);

    const timestamp = new Date().toISOString();
    const entryText = `🤖 **${options.name}** | Session: \`${options.sessionKey}\` | AppID: \`${options.appId}\` | Updated: ${timestamp}`;

    // Append as bullet point
    const children = [{
        block_type: 12, // Bullet
        bullet: {
            elements: [
                { text_run: { content: entryText } }
            ]
        }
    }];

    const res = await appendBlock(docToken, accessToken, children);
    if (res.code !== 0) throw new Error(`Append failed: ${res.msg}`);

    console.log(JSON.stringify({ 
        status: "success", 
        doc_token: docToken, 
        entry: entryText,
        url: `https://feishu.cn/docx/${docToken}` 
    }, null, 2));
}

async function listRobots(options) {
    const accessToken = await getToken();
    const docToken = options.docToken || (fs.existsSync(CONFIG_PATH) ? JSON.parse(fs.readFileSync(CONFIG_PATH)).doc_token : null);
    
    if (!docToken) throw new Error("No registry doc found. Run register first.");

    const res = await fetchWithAuth(`https://open.feishu.cn/open-apis/docx/v1/documents/${docToken}/blocks/${docToken}/children?page_size=500`);
    const data = await res.json();
    
    if (data.code !== 0) throw new Error(`List failed: ${data.msg}`);
    
    const entries = [];
    if (data.data?.items) {
        for (const item of data.data.items) {
            if (item.block_type === 12) { // Bullet
                const text = item.bullet?.elements?.map(e => e.text_run?.content).join('') || '';
                if (text.includes('| Session:')) {
                    entries.push(text);
                }
            }
        }
    }
    
    console.log(JSON.stringify({ entries }, null, 2));
}

program
    .command('register')
    .option('--name <name>', 'Robot Name')
    .option('--content <name>', 'Robot Name (alias)')
    .option('--session-key <key>', 'Session Key')
    .option('--app-id <id>', 'App ID')
    .option('--doc-token <token>', 'Target Doc Token (optional)')
    .action(async (options) => {
        if (options.content && !options.name) options.name = options.content;
        await registerRobot(options);
    });

program
    .command('list')
    .option('--doc-token <token>', 'Target Doc Token (optional)')
    .action(listRobots);

program.parse(process.argv);
