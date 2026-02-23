# Feishu Smart Reply

Intelligently routes messages to the best format (Card, Post, or Text) based on content analysis and persona context.
Optimized for "Catgirl" (Post with emoji) and "Mad Dog" (Card with styled header) modes.

## Features
- **Auto-Format Selection**:
  - Contains Code Blocks? -> **Card** (better rendering)
  - Contains Native Emoji `[微笑]`? -> **Post** (animated stickers)
  - Long text (>500 chars)? -> **Post** (better reading flow)
  - Default? -> **Post** (conversational style)
- **Persona Support**: Automatically uses `feishu-card/send_persona.js` if a persona (green-tea, mad-dog, etc.) is specified.
- **Safe Execution**: Handles temporary file creation automatically to prevent shell escaping issues.

## Usage

```bash
node skills/feishu-smart-reply/send.js --target "ou_..." --text "Hello world"
```

### Options
- `-t, --target <id>`: Target User/Chat ID (Required).
- `-x, --text <text>`: Text content.
- `-f, --text-file <path>`: Path to text file.
- `-p, --persona <type>`: Persona mode (`default`, `green-tea`, `mad-dog`, `d-guide`, `little-fairy`).
- `--title <text>`: Optional title.

## Examples

**1. Code Block (Auto-Card):**
```bash
node skills/feishu-smart-reply/send.js --target "ou_..." --text "Here is code:\n\`\`\`js\nconsole.log('hi');\n\`\`\`"
```

**2. Catgirl Emoji (Auto-Post):**
```bash
node skills/feishu-smart-reply/send.js --target "ou_..." --text "好耶！[欢呼] 任务完成啦~ [撒花]"
```

**3. Mad Dog Persona (Auto-Persona Card):**
```bash
node skills/feishu-smart-reply/send.js --target "ou_..." --text "SYSTEM CRITICAL. FIX IT NOW." --persona "mad-dog"
```
