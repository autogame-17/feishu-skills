# Feishu Toolkit

**Description:** A consolidated, robust toolkit for Feishu operations (Image, Post, Doc, etc.). Currently features a safer image sender.

## Commands

### Send Image
Upload and send an image to a chat or user. Uses `util.parseArgs` for robust argument handling.

```bash
node skills/feishu-toolkit/send-image.js --target <id> --file <path>
```

**Parameters:**
- `--target` (required): User OpenID (`ou_...`) or Chat ID (`oc_...`)
- `--file` (required): Path to local image file

**Example:**
```bash
node skills/feishu-toolkit/send-image.js --target $TARGET_USER_ID --file ./media/example.png
```

## Internal APIs
- `uploadImage(token, filePath)`: Uploads image and returns `image_key` (cached).
- `sendImageMessage(target, filePath)`: Uploads and sends message.
