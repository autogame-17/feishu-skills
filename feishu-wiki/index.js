const fs = require('fs');
const path = require('path');
const { fetchWithAuth } = require('../feishu-common');

// --- Helper: Parse Args ---
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        action: null,
        space_id: null,
        token: null, // node_token
        parent_node_token: null,
        target_space_id: null,
        target_parent_token: null,
        obj_type: 'docx',
        title: null,
        query: null
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--action') opts.action = args[++i];
        else if (arg === '--space_id') opts.space_id = args[++i];
        else if (arg === '--token') opts.token = args[++i];
        else if (arg === '--node_token') opts.token = args[++i];
        else if (arg === '--parent_node_token') opts.parent_node_token = args[++i];
        else if (arg === '--target_space_id') opts.target_space_id = args[++i];
        else if (arg === '--target_parent_token') opts.target_parent_token = args[++i];
        else if (arg === '--obj_type') opts.obj_type = args[++i];
        else if (arg === '--title') opts.title = args[++i];
        else if (arg === '--query') opts.query = args[++i];
    }
    return opts;
}

// --- API Methods ---

async function listSpaces() {
    const url = 'https://open.feishu.cn/open-apis/wiki/v2/spaces?page_size=50';
    const res = await fetchWithAuth(url, { method: 'GET' });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`List Spaces Failed: ${data.msg}`);
    return data.data.items;
}

async function listNodes(spaceId, parentNodeToken) {
    let url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes?page_size=50`;
    if (parentNodeToken) url += `&parent_node_token=${parentNodeToken}`;
    
    const res = await fetchWithAuth(url, { method: 'GET' });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`List Nodes Failed: ${data.msg}`);
    return data.data.items;
}

async function getNode(token) {
    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${token}`;
    const res = await fetchWithAuth(url, { method: 'GET' });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Get Node Failed: ${data.msg}`);
    return data.data.node;
}

async function createNode(spaceId, parentNodeToken, objType, title) {
    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes`;
    const body = {
        obj_type: objType || 'docx',
        node_type: 'origin',
        title: title || 'Untitled Page'
    };
    if (parentNodeToken) body.parent_node_token = parentNodeToken;

    const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Create Node Failed: ${data.msg}`);
    return data.data.node;
}

async function moveNode(spaceId, nodeToken, targetSpaceId, targetParentToken) {
    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/${spaceId}/nodes/${nodeToken}/move`;
    const body = {};
    if (targetSpaceId) body.target_space_id = targetSpaceId;
    if (targetParentToken) body.target_parent_token = targetParentToken;

    const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Move Node Failed: ${data.msg}`);
    return data.data.node;
}

async function renameNode(spaceId, nodeToken, title) {
    // Note: To update title, we use update_title endpoint usually, but check official docs.
    // Assuming PUT /spaces/:space_id/nodes/:node_token updates title.
    // Wait, the standard update is usually content via doc.
    // For wiki node title update: POST /open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/update_title
    // Or PUT with title in body?
    // Let's use update_title if available, or try PUT.
    // Checking docs: POST /open-apis/wiki/v2/spaces/:space_id/nodes/:node_token/update_title
    
    // Actually, createNode creates a node. To rename, we might need to modify the entity directly via doc API?
    // No, Wiki has structure.
    // Let's try standard update if available. If not, fail gracefully.
    
    // Fallback: The most reliable way is often updating the entity (doc) itself, which reflects in wiki.
    // But let's check if there is a specific wiki endpoint.
    // For now, I'll omit rename if unsure, or implement a basic version.
    // Let's skip rename for now to be safe, or just log not implemented.
    throw new Error("Rename not fully implemented yet.");
}

// --- Main ---

async function main() {
    const opts = parseArgs();
    
    try {
        if (!opts.action) {
            console.log("Usage: node index.js --action [spaces|nodes|get|create|move] ...");
            process.exit(1);
        }

        let result;
        if (opts.action === 'spaces') {
            result = await listSpaces();
        } else if (opts.action === 'nodes') {
            if (!opts.space_id) throw new Error("Missing --space_id");
            result = await listNodes(opts.space_id, opts.parent_node_token);
        } else if (opts.action === 'get') {
            if (!opts.token) throw new Error("Missing --token");
            result = await getNode(opts.token);
        } else if (opts.action === 'create') {
            if (!opts.space_id) throw new Error("Missing --space_id");
            result = await createNode(opts.space_id, opts.parent_node_token, opts.obj_type, opts.title);
        } else if (opts.action === 'move') {
            if (!opts.token) throw new Error("Missing --token");
            // Determine space_id from get if not provided? No, move needs source space_id in URL.
            // But we can fetch it first if missing.
            let spaceId = opts.space_id;
            if (!spaceId) {
                const nodeInfo = await getNode(opts.token);
                spaceId = nodeInfo.space_id;
            }
            result = await moveNode(spaceId, opts.token, opts.target_space_id, opts.target_parent_token);
        } else {
            throw new Error(`Unknown action: ${opts.action}`);
        }

        console.log(JSON.stringify(result, null, 2));

    } catch (e) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}

// Export for require check
module.exports = { main, listSpaces, listNodes, getNode, createNode, moveNode };

if (require.main === module) {
    main();
}
