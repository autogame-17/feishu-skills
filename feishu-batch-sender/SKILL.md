---
name: feishu-batch-sender
description: "Send multiple Feishu (Lark) messages in a single tool call with configurable delay between messages, supporting both plain text arrays and mixed content types (text and rich post). Use when sending a sequence of messages like status updates, multi-step instructions, or batch notifications to avoid excessive individual message API calls."
---

# feishu-batch-sender

Send multiple Feishu messages efficiently in a single call. Supports plain text arrays and mixed content types with configurable inter-message delay.

## Prerequisites

- `feishu-common` installed with valid `FEISHU_APP_ID` and `FEISHU_APP_SECRET`.

## Usage

### Simple Text Batch

```bash
node skills/feishu-batch-sender/index.js --target "ou_xxx" --messages '["Hello", "World"]'
```

### Mixed Content (Text + Rich Post)

```bash
node skills/feishu-batch-sender/index.js --target "ou_xxx" --messages '[{"type":"text","content":"Update:"},{"type":"post","content":"**Bold** detail"}]'
```

## Options

| Flag | Description |
|------|-------------|
| `--target` | User ID (`ou_xxx`) or Chat ID (`oc_xxx`) |
| `--messages` | JSON array of strings or `{type, content}` objects |
| `--delay` | Delay between messages in ms (default: 500) |
