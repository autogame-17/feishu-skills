# Feishu Batch Sender

A tool to send multiple Feishu messages efficiently in a single tool call. Use this when you need to send a sequence of messages (e.g., status updates, multi-step instructions) to avoid excessive individual `message` tool usage.

## Usage

```javascript
// Send multiple text messages
node skills/feishu-batch-sender/index.js --target "ou_xxx" --messages '["Hello", "World"]'

// Send mixed content (text + post)
node skills/feishu-batch-sender/index.js --target "ou_xxx" --messages '[{"type":"text","content":"Update:"},{"type":"post","content":"**Bold** detail"}]'
```

## Options

- `--target`: User ID (`ou_xxx`) or Chat ID (`oc_xxx`).
- `--messages`: JSON array of strings (for simple text) or objects `{type, content}`.
- `--delay`: Delay between messages in ms (default: 500).

## Environment

Requires `FEISHU_APP_ID` and `FEISHU_APP_SECRET` in `.env` (or valid token via `feishu-client`).
