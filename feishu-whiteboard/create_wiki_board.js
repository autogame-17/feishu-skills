const { apiRequest } = require('./api');

async function createWikiBoard(spaceId, parentToken, title) {
    try {
        console.log(`Creating Wiki Board in Space ${spaceId} under ${parentToken}...`);
        const res = await apiRequest('POST', `/open-apis/wiki/v2/spaces/${spaceId}/nodes`, {
            obj_type: "whiteboard",
            node_type: "origin",
            parent_node_token: parentToken,
            title: title
        });
        console.log("Success:", JSON.stringify(res, null, 2));
    } catch (e) {
        console.error("Create Failed:", e.message);
    }
}

function getWikiConfig() {
    const spaceId = process.env.FEISHU_WIKI_SPACE_ID
        || process.argv.find(a => a.startsWith('--space-id='))?.split('=')[1]
        || (process.argv.includes('--space-id') && process.argv[process.argv.indexOf('--space-id') + 1]);
    const parentToken = process.env.FEISHU_WIKI_PARENT_TOKEN
        || process.argv.find(a => a.startsWith('--parent-token='))?.split('=')[1]
        || (process.argv.includes('--parent-token') && process.argv[process.argv.indexOf('--parent-token') + 1]);
    const title = process.argv.find(a => a.startsWith('--title='))?.split('=')[1]
        || (process.argv.includes('--title') && process.argv[process.argv.indexOf('--title') + 1])
        || "SoulBadge Architecture Diagram";
    if (!spaceId || !parentToken) {
        console.error('Error: FEISHU_WIKI_SPACE_ID and FEISHU_WIKI_PARENT_TOKEN env vars (or --space-id and --parent-token args) required');
        process.exit(1);
    }
    return { spaceId, parentToken, title };
}

if (require.main === module) {
    const { spaceId, parentToken, title } = getWikiConfig();
    createWikiBoard(spaceId, parentToken, title);
}
