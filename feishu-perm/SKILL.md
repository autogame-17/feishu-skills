---
name: feishu-perm
description: Feishu permission management for documents and files. Activate when user mentions sharing, permissions, collaborators.
tags: [feishu, permission, share, collaborator, drive]
---

# Feishu Permission Skill

Manage collaborators and public link settings for Feishu Drive files (Docs, Sheets, Bitables, Wikis, Files).

## Usage

```bash
# Add a collaborator (read-only)
node skills/feishu-perm/index.js --action add --token "shttc..." --type "sheet" --member_id "ou_..." --perm "view"

# List collaborators
node skills/feishu-perm/index.js --action list --token "docx..." --type "docx"

# Remove a collaborator
node skills/feishu-perm/index.js --action remove --token "docx..." --type "docx" --member_id "ou_..."

# Update a collaborator (to edit)
node skills/feishu-perm/index.js --action update --token "docx..." --type "docx" --member_id "ou_..." --perm "edit"

# Set public link sharing (Tenant Read)
node skills/feishu-perm/index.js --action public --token "docx..." --type "docx" --link_share_entity "tenant_readable"
```

## Arguments

- `--action`: `add`, `remove`, `list`, `update`, `public`
- `--token`: File token (from URL)
- `--type`: `doc`, `docx`, `sheet`, `bitable`, `file`, `wiki`, `folder` (default: `doc`)
- `--member_id`: User Open ID (`ou_...`) or Chat ID (`oc_...`)
- `--member_type`: `user`, `chat`, `department`, `group` (default: `user`)
- `--perm`: `view`, `edit`, `full_access`
- `--link_share_entity`:
  - `tenant_readable`: Organization members can read
  - `tenant_editable`: Organization members can edit
  - `anyone_readable`: Anyone with link can read (if allowed by tenant)
  - `anyone_editable`: Anyone with link can edit
  - `closed`: Only invited members
- `--notify`: `true`/`false` (send notification to new member)
