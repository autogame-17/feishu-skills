# Feishu Toolkit

A unified, dependency-free toolkit for Feishu operations using Node.js built-ins.

## Commands

### Send Image
Upload and send an image to a chat or user.

```bash
node skills/feishu-toolkit/send-image.js --target <id> --file <path>
```

Arguments:
- `--target` (required): User OpenID (`ou_...`) or Chat ID (`oc_...`)
- `--file` (required): Path to image file
- `--debug` (optional): Enable verbose logging

## Features
- Uses `util.parseArgs` (Node.js native) - No external CLI deps
- Shared authentication via `skills/feishu-common/index.js`
- Automatic caching of image keys
