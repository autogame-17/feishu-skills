const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { getToken } = require('../feishu-common/index.js');

async function searchDocs(query, limit = 5) {
  if (!query) {
    console.error('Error: query is required');
    process.exit(1);
  }

  try {
    const token = await getToken();
    // Search API: https://open.feishu.cn/document/server-docs/search-v2/suite-search/create
    const response = await axios.post(
      'https://open.feishu.cn/open-apis/search/v2/message', 
      {
        query: query,
        from_ids: [], // Search all accessible
        view_type: "full",
        page_size: limit
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code !== 0) {
      console.error(`Feishu API Error: ${response.data.msg}`);
      process.exit(1);
    }

    // Adapt to search docs/wiki specifically if message search isn't what we want.
    // Actually, for docs, let's use the drive search or wiki search.
    // Drive Search: https://open.feishu.cn/document/server-docs/docs/drive/search/search
    
    const driveResponse = await axios.post(
        'https://open.feishu.cn/open-apis/drive/v1/files/search',
        {
            search_key: query,
            count: limit,
            type: "doc" // doc, sheet, bitable, mindnote, file, slide, wiki
        },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (driveResponse.data.code !== 0) {
        console.error(`Feishu Drive Search Error: ${driveResponse.data.msg}`);
        process.exit(1);
    }

    const files = driveResponse.data.data.files || [];
    
    if (files.length === 0) {
        console.log("No documents found.");
        return;
    }

    console.log(JSON.stringify(files.map(f => ({
        token: f.token,
        name: f.name,
        type: f.type,
        url: f.url
    })), null, 2));

  } catch (error) {
    console.error('Network/System Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const queryIndex = args.indexOf('--query');
const query = queryIndex !== -1 ? args[queryIndex + 1] : null;

if (!query) {
    console.log("Usage: node index.js --query 'search term'");
    process.exit(1);
}

searchDocs(query);
