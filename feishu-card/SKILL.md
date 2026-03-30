---
name: feishu-card
description: Send rich interactive cards to Feishu (Lark) users or groups with Markdown support, colored headers, action buttons, embedded images, and AI persona styling.
---

# feishu-card

Send rich interactive cards to Feishu users or groups. Supports Markdown (code blocks, tables), titled color headers, action buttons, embedded images, and AI persona styling.

## Prerequisites

- `feishu-common` installed with valid credentials.
- This skill depends on `../feishu-common/index.js` for token and API auth.

## Usage

### Simple Text

```bash
node skills/feishu-card/send.js --target "ou_..." --text "Hello World"
```

### Markdown / Complex Content (Recommended)

To prevent shell escaping issues (e.g., swallowed backticks), ALWAYS write content to a file first.

1. Write content to a temp file:
```bash
write temp/msg.md "Here is some code:\n\`\`\`js\nconsole.log('hi');\n\`\`\`"
```

2. Send using `--text-file`:
```bash
node skills/feishu-card/send.js --target "ou_..." --text-file "temp/msg.md" --title "Report" --color green
```

### Safe Send (Auto Temp File)

Handles file creation and cleanup automatically -- use for inline markdown without manual temp files:

```bash
node skills/feishu-card/send_safe.js --target "ou_..." --text "Content with \`backticks\` and *markdown*" --title "Safe Message"
```

### Persona Messaging

Send themed messages from AI personas with automatic header styling:

```bash
node skills/feishu-card/send_persona.js --target "ou_..." --persona "d-guide" --text "Critical error detected."
```

Supported Personas:
- **d-guide**: Red warning header, bold/code prefix. Snarky suffix.
- **green-tea**: Carmine header, soft/cutesy style.
- **mad-dog**: Grey header, raw runtime error style.
- **default**: Standard blue header.

## Options

| Flag | Description |
|------|-------------|
| `-t, --target <id>` | User Open ID (`ou_...`) or Chat ID (`oc_...`) |
| `-x, --text <string>` | Simple text content |
| `-f, --text-file <path>` | Markdown file path (use for code/logs) |
| `--title <string>` | Card header title |
| `--color <string>` | Header color: blue, red, orange, green, purple, grey (default: blue) |
| `--button-text <string>` | Action button label |
| `--button-url <url>` | Action button URL |
| `--image-path <path>` | Local image to upload and embed |
| `-p, --persona <type>` | Persona style -- d-guide, green-tea, mad-dog (send_persona.js only) |

## Troubleshooting

- **Missing Text**: Did you use backticks in `--text`? The shell likely ate them. Use `--text-file` or `send_safe.js` instead.
