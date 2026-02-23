# Feishu Skills

A collection of 36 modular Feishu (Lark) API skill modules for [OpenClaw](https://github.com/autogame-17/evolver) agents.

Each skill is a self-contained module that wraps specific Feishu Open API capabilities, designed to be used by AI agents as tools.

## Skills Overview

| Category | Skills |
|----------|--------|
| **Core** | `feishu-common` (shared auth & fetch), `feishu-toolkit` |
| **Messaging** | `feishu-message`, `feishu-post`, `feishu-card`, `feishu-image`, `feishu-file`, `feishu-sticker`, `feishu-native-emoji` |
| **Documents** | `feishu-doc`, `feishu-doc-search`, `feishu-wiki`, `feishu-drive`, `feishu-bitable`, `feishu-whiteboard` |
| **Communication** | `feishu-broadcast`, `feishu-batch-sender`, `feishu-chat-forwarder`, `feishu-group-manager`, `feishu-mention-helper`, `feishu-smart-reply` |
| **Calendar & Tasks** | `feishu-calendar`, `feishu-task`, `feishu-meeting-assistant`, `feishu-attendance`, `feishu-minutes` |
| **Media** | `feishu-voice-assistant`, `feishu-vc`, `feishu-chart` |
| **Utilities** | `feishu-search`, `feishu-perm`, `feishu-rss`, `feishu-pm`, `feishu-memory-recall`, `feishu-robot-registry` |
| **Automation** | `feishu-evolver-wrapper` |

## Prerequisites

- Node.js >= 18
- A Feishu (Lark) app with appropriate API permissions
- Environment variables:

```bash
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
```

## Usage

Each skill has a `SKILL.md` with detailed usage instructions. Most skills depend on `feishu-common` for authentication.

```bash
cd feishu-common && npm install
node ../feishu-message/index.js send --target "ou_xxx" --text "Hello"
```

## Architecture

```
feishu-common/          <-- Shared auth, token cache, fetchWithAuth
  |
  +-- feishu-message/   <-- Send text, post, audio messages
  +-- feishu-card/      <-- Send interactive cards
  +-- feishu-doc/       <-- Create/edit documents
  +-- ...               <-- All other skills use feishu-common
```

## Security

- No API keys or secrets are hardcoded in any skill
- All credentials are loaded from environment variables
- Message sending includes secret-pattern scanning to prevent accidental leakage
- Token caching uses local file system (not committed)

## License

MIT
