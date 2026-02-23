const { getTenantAccessToken } = require('./auth');

const BASE_URL = 'https://open.feishu.cn/open-apis/drive/v1';

async function callFeishu(method, path, body = null, params = {}) {
  const token = await getTenantAccessToken();
  let url = `${BASE_URL}${path}`;

  const query = new URLSearchParams(params).toString();
  if (query) {
    url += `?${query}`;
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Feishu API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Feishu API Error: ${data.msg} (code: ${data.code})`);
  }

  return data.data;
}

async function listFiles(folderToken, pageToken) {
  const params = {};
  if (folderToken) params.folder_token = folderToken;
  if (pageToken) params.page_token = pageToken;

  return callFeishu('GET', '/files', null, params);
}

async function getFileInfo(fileToken) {
  // GET /drive/v1/metas/batch_query requires type.
  // We'll try to guess or just return basic info if available.
  // For now, we'll try the old V2 explorer API if V1 fails? No, stay with V1.
  // There isn't a simple "get info by token" in V1 without type.
  // We will return a placeholder or error.
  throw new Error("Action 'info' not fully supported for single file token without type. Please use 'list' on the parent folder.");
}

async function createFolder(name, folderToken) {
  return callFeishu('POST', '/files/create_folder', {
    name,
    folder_token: folderToken || '' // Root if empty
  });
}

async function moveFile(fileToken, folderToken) {
  return callFeishu('POST', `/files/${fileToken}/move`, {
    folder_token: folderToken
  });
}

async function deleteFile(fileToken, type) {
  return callFeishu('DELETE', `/files/${fileToken}`, {
    type: type || 'file' 
  });
}

module.exports = {
  listFiles,
  getFileInfo,
  createFolder,
  moveFile,
  deleteFile
};
