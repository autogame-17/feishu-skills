# Feishu Drive Skill

Manage Feishu cloud storage files and folders.

## Features
- List files in a folder (defaults to root)
- Create new folders
- Move files/folders
- Delete files/folders (move to trash)
- Get file info (via list metadata)

## Usage

```bash
# List root
node skills/feishu-drive/index.js --action list

# List specific folder
node skills/feishu-drive/index.js --action list --folder_token fld_xxx

# Create folder
node skills/feishu-drive/index.js --action create_folder --name "My Project" --folder_token fld_xxx

# Move file
node skills/feishu-drive/index.js --action move --file_token box_xxx --folder_token fld_dest

# Delete file
node skills/feishu-drive/index.js --action delete --file_token box_xxx --type file
```

## Setup
Ensure `FEISHU_APP_ID` and `FEISHU_APP_SECRET` are set in `.env` or `config.json`.
Uses `feishu-doc` shared token cache if available.
