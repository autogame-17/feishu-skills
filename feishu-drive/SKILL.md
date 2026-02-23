# Feishu Drive Skill

Feishu cloud storage file management. Actions: list, info, create_folder, move, delete.

## Tool: feishu_drive

Feishu cloud storage operations.

### Parameters

- `action` (string, required): Action to perform.
  - `list`: List files in a folder.
  - `info`: Get file/folder metadata.
  - `create_folder`: Create a new folder.
  - `move`: Move a file or folder.
  - `delete`: Delete a file or folder (move to trash).
- `file_token` (string): File or folder token (required for info, move, delete).
- `folder_token` (string): Parent folder token (optional, defaults to root for list/create).
- `name` (string): Folder name (required for create_folder).
- `type` (string): File type (optional, for validation).
  - `doc`, `docx`, `sheet`, `bitable`, `folder`, `file`

### Usage

```javascript
// List root folder
feishu_drive({ action: "list" })

// List specific folder
feishu_drive({ action: "list", folder_token: "fld_xxx" })

// Get file info
feishu_drive({ action: "info", file_token: "box_xxx" })

// Create folder
feishu_drive({ action: "create_folder", name: "New Project", folder_token: "fld_parent" })

// Move file
feishu_drive({ action: "move", file_token: "box_xxx", folder_token: "fld_dest" })

// Delete file
feishu_drive({ action: "delete", file_token: "box_xxx", type: "file" })
```
