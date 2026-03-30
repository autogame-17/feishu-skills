---
name: feishu-common
description: "Shared Feishu (Lark) authentication and API request helper that provides tenant token acquisition with caching, automatic retry with timeout handling, and authenticated request wrappers with token refresh. Use when building or running any Feishu skill that needs API access, setting up Feishu app credentials, or bootstrapping dependent Feishu modules."
---

# feishu-common

Shared authentication and API helper for all OpenClaw Feishu skills. Install this skill first — every other `feishu-*` skill depends on it.

## Prerequisites

Set these environment variables before using any Feishu skill:

```bash
export FEISHU_APP_ID=cli_xxxxx
export FEISHU_APP_SECRET=xxxxx
```

## Usage

Import the shared helpers in any dependent skill:

```javascript
const { getToken, fetchWithRetry, fetchWithAuth } = require("../feishu-common/index.js");
```

### Workflow

1. **Authenticate** — `getToken()` acquires a tenant access token and caches it locally, refreshing automatically on expiry.
2. **Make requests** — `fetchWithAuth(url, options)` adds the `Authorization` header and handles token refresh on 401 responses.
3. **Handle failures** — `fetchWithRetry(url, options)` wraps fetch with configurable retry count and timeout.

### Compatibility Alias

A legacy import path is available for backward compatibility:

```javascript
const { getToken, fetchWithAuth } = require("../feishu-common/feishu-client.js");
```

## Files

- `index.js` — Main implementation (token cache, retry logic, authenticated fetch).
- `feishu-client.js` — Compatibility alias that re-exports from `index.js`.
