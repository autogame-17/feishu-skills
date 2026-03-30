---
name: feishu-card
description: "Send rich interactive cards to Feishu (Lark) users or groups with Markdown support, colored headers, action buttons, embedded images, and AI persona styling. Use when sending formatted messages with code blocks, tables, or markdown to Feishu, creating interactive cards with buttons, sending persona-styled messages, or delivering content that requires safe shell escaping."
---

# feishu-card

Send rich interactive cards to Feishu users or groups. Supports Markdown (code blocks, tables), titled color headers, action buttons, embedded images, and AI persona styling.

## Prerequisites

- `feishu-common` installed with valid credentials.

## Workflow

### Simple Text

```bash
node skills/feishu-card/send.js --target "ou_..." --text "Hello World"
```

### Markdown / Complex Content (Recommended)

Write content to a file first to avoid shell escaping issues with backticks:

```bash
node skills/feishu-card/send.js --target "ou_..." --text-file "temp/msg.md" --title "Report" --color green
```

### Safe Send (Auto Temp File)

Handles file creation and cleanup automatically — use for inline markdown without manual temp files:

```bash
node skills/feishu-card/send_safe.js --target "ou_..." --text "Content with \`backticks\`" --title "Safe Message"
```

### Persona Messaging

Send themed messages from AI personas with automatic header styling:

```bash
node skills/feishu-card/send_persona.js --target "ou_..." --persona "d-guide" --text "Critical error detected."
```

Personas: `d-guide` (red warning), `green-tea` (carmine, soft style), `mad-dog` (grey, raw error style), `default` (standard blue).

## Options

| Flag | Description |
|------|-------------|
| `-t, --target <id>` | User Open ID (`ou_...`) or Chat ID (`oc_...`) |
| `-x, --text <string>` | Simple text content |
| `-f, --text-file <path>` | Markdown file path (use for code/logs) |
| `--title <string>` | Card header title |
| `--color <string>` | Header color: blue, red, orange, green, purple, grey |
| `--button-text <string>` | Action button label |
| `--button-url <url>` | Action button URL |
| `--image-path <path>` | Local image to upload and embed |
| `-p, --persona <type>` | Persona style (send_persona.js only) |

## Troubleshooting

If text disappears when using `--text` with backticks or special characters, switch to `--text-file` or use `send_safe.js` — the shell strips unescaped characters.
