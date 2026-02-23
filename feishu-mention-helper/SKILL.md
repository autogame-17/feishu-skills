# Feishu Mention Helper

Resolves Feishu user/bot names to OpenIDs to enable functional @mentions in group chats.

## Usage

```bash
node skills/feishu-mention-helper/lookup.js --name "Name To Find"
```

## Features

- Searches Feishu user directory (requires appropriate permissions)
- Caches results to `skills/identity-manager/identities.json` if available
- Returns formatted mention string `<at user_id="ou_...">Name</at>`
