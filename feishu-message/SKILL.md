---
name: feishu-message
description: "Unified CLI for Feishu (Lark) messaging operations including fetching messages by ID, sending audio voice bubbles, creating group chats, listing pinned messages, and adding emoji reactions. Use when retrieving message content, sending voice messages, managing group chats, checking pinned items, or reacting to messages in Feishu."
---

# feishu-message

Unified CLI for Feishu messaging — fetch, send audio, create chats, list pins, and add reactions through a single entry point.

## Prerequisites

- `feishu-common` installed with valid `FEISHU_APP_ID` and `FEISHU_APP_SECRET`.

## Commands

All commands use the unified CLI:

```bash
node skills/feishu-message/index.js <command> [options]
```

### Get Message

Fetch message content by ID. Use `--recursive` for merged/forwarded messages.

```bash
node skills/feishu-message/index.js get <message_id> [--raw] [--recursive]
```

### Send Audio

Send an audio file as a voice bubble to a user or chat.

```bash
node skills/feishu-message/index.js send-audio --target <ou_xxx|oc_xxx> --file <path> [--duration <ms>]
```

### Create Group Chat

Create a new group chat with specified users.

```bash
node skills/feishu-message/index.js create-chat --name "Project Alpha" --users "ou_1" "ou_2" --desc "Description"
```

### List Pins

List pinned messages in a chat.

```bash
node skills/feishu-message/index.js list-pins <chat_id>
```

### Add Reaction

Add an emoji reaction to a message.

```bash
node skills/feishu-message/reaction.js --message-id <msg_id> --type <emoji_type>
```

Supported types: `THUMBSUP` (default), `HEART`, `LAUGH`, `WOW`, `SAD`, `ANGRY`.

## Legacy Scripts

Standalone scripts remain available for backward compatibility: `get.js`, `send-audio.js`, `create_chat.js`, `list_pins_v2.js`.
