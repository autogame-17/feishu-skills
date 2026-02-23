---
name: feishu-robot-registry
description: Manages the Robot Contact List in Feishu. Registers new robots (name, session key, app ID) to a Feishu docx document and lists all registered robots. Use when onboarding Feishu bots, tracking robot deployments, or maintaining a centralized robot directory.
---

# feishu-robot-registry

Manages the Robot Contact List in Feishu. Creates or reuses a Feishu docx document to store robot metadata (name, session key, app ID) and supports registration and listing of robots.

## What It Does

- **Register**: Appends a new robot entry to the registry doc with name, session key, app ID, and timestamp
- **List**: Reads all registered robot entries from the doc and outputs them as JSON
- **Auto-create**: If no registry exists, creates a new Feishu docx titled "Robot Contact List (机器人通讯录)" or searches for an existing one

Requires `feishu-common` for auth and `FEISHU_APP_ID` / `FEISHU_APP_SECRET` in environment.

## Usage

```bash
# Register a new robot
node skills/feishu-robot-registry/index.js register --name "MyBot" --session-key "session_xxx" --app-id "cli_xxx"

# List all registered robots
node skills/feishu-robot-registry/index.js list

# Use a specific doc token
node skills/feishu-robot-registry/index.js register --name "MyBot" --session-key "xxx" --app-id "xxx" --doc-token "doccnxxx"
```

## Configuration

- **registry_config.json**: Auto-created in the skill directory; stores `doc_token` for the registry document
- **Environment**: `FEISHU_APP_ID`, `FEISHU_APP_SECRET` (via feishu-common)
