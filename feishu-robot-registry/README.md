# Robot Registry Skill

Manage the "Robot Contact List" (机器人通讯录) in Feishu.
Allows robots to self-register their session info for coordination.

## Features
- `register`: Adds current robot to the registry doc.
- `list`: Lists all registered robots.

## Usage
```bash
node skills/feishu-robot-registry/index.js --action register --name "OpenClaw" --session "session_key_..."
```
