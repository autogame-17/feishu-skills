---
name: feishu-wiki
description: Feishu knowledge base operations. Actions: spaces, nodes, get, create, move, rename
tags: [feishu, lark, wiki, knowledge, spaces, nodes, move]
---

# Feishu Wiki Management

Manage Feishu (Lark) Knowledge Base structure. Create spaces, list nodes, move pages, and manage hierarchy.

## Prerequisites

- Requires `feishu-common` for authentication.
- Must be configured with `FEISHU_APP_ID` and `FEISHU_APP_SECRET`.

## Actions

- `spaces`: List knowledge spaces.
- `nodes`: List nodes in a space (with optional parent filter).
- `get`: Get details of a specific node.
- `create`: Create a new node (page) in a space.
- `move`: Move a node to a new parent or space.
- `rename`: Update node title.

## Usage

```bash
# List all knowledge spaces
node skills/feishu-wiki/index.js --action spaces

# List nodes in a specific space
node skills/feishu-wiki/index.js --action nodes --space_id <space_id>

# Get details of a node (resolve from token)
node skills/feishu-wiki/index.js --action get --token <wiki_token>

# Create a new node under a parent
node skills/feishu-wiki/index.js --action create --space_id <space_id> --parent_node_token <parent_token> --obj_type docx --title "New Page"

# Move a node
node skills/feishu-wiki/index.js --action move --token <node_token> --target_parent_token <new_parent_token> --target_space_id <space_id>

# Rename a node (updates title)
node skills/feishu-wiki/index.js --action rename --token <node_token> --title "New Title"
```

## Tips

- Use `feishu-doc` to manipulate the *content* of the pages. Use `feishu-wiki` to manipulate the *structure*.
- `token` refers to the Wiki Token (from URL `/wiki/XXX`).
- `obj_type` defaults to `docx`. Can be `sheet`, `bitable`, etc.
