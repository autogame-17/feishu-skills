const fs = require('fs');
const path = require('path');
const { fetchWithAuth } = require('../feishu-common/index.js');

async function searchMessages(query, limit = 10) {
    // https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/im-v1/message/read_users
    // Note: Feishu strict message search API is complex/restricted. 
    // We will use the 'search' API suite if available, or simulate via message iteration if needed.
    // For V1, we'll use the official suite-search/v1/search/message/ endpoint if accessible, 
    // or the commonly available /im/v1/messages with recursion (slow).
    
    // Better approach for "Search": Use the new Search API (Haystack/Search).
    // POST /open-apis/search/v2/message
    
    console.log(`Searching messages for: "${query}" (limit: ${limit})`);
    
    try {
        const response = await fetchWithAuth('https://open.feishu.cn/open-apis/search/v2/message', {
            method: 'POST',
            body: JSON.stringify({
                query: query,
                page_size: limit,
                mode: 1 // 1: precise, 2: fuzzy (default)
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.code !== 0) {
            console.error(`Feishu API Error: ${data.msg} (Code: ${data.code})`);
            return;
        }

        const items = (data.data && data.data.items) || [];
        if (items.length === 0) {
            console.log('No messages found.');
            return;
        }

        items.forEach((item, idx) => {
             console.log(`[${idx+1}] ${item.sender_id} -> ${item.chat_id}: ${item.message_content.substring(0, 100)}...`);
        });

    } catch (error) {
         console.error('Search failed:', error.message);
         // Fallback or helpful error
         console.log("Ensure the app has 'search:message' permission.");
    }
}

async function searchDocs(query, limit = 10) {
    // POST /open-apis/suite/docs-api/search/object
    console.log(`Searching docs for: "${query}" (limit: ${limit})`);

    try {
        const response = await fetchWithAuth('https://open.feishu.cn/open-apis/suite/docs-api/search/object', {
            method: 'POST',
            body: JSON.stringify({
                search_key: query,
                count: limit,
                type: "doc,sheet,bitable,mindnote,file,slide,wiki"
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

         if (data.code !== 0) {
            console.error(`Feishu API Error: ${data.msg} (Code: ${data.code})`);
            return;
        }

        const docs = (data.data && data.data.docs) || [];
         if (docs.length === 0) {
            console.log('No docs found.');
            return;
        }

        docs.forEach((doc, idx) => {
            console.log(`[${idx+1}] [${doc.type}] ${doc.title} (${doc.url})`);
        });

    } catch (error) {
        console.error('Search failed:', error.message);
    }
}


// CLI Handler
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.log("Usage: node index.js <search_messages|search_docs> --query <text>");
    process.exit(1);
}

const queryIdx = args.indexOf('--query');
const query = queryIdx !== -1 ? args[queryIdx + 1] : null;

if (!query) {
    console.error("Error: --query is required");
    process.exit(1);
}

(async () => {
    if (command === 'search_messages') {
        await searchMessages(query);
    } else if (command === 'search_docs') {
        await searchDocs(query);
    } else {
        console.error("Unknown command. Supported: search_messages, search_docs");
    }
})();
