---
name: feishu-task
description: Manage Feishu (Lark) Tasks. Create tasks, set due dates, and assign users for collaboration.
---

# feishu-task

A skill to manage Feishu (Lark) Tasks directly via the Open Platform API.

## Usage

```bash
# Create a task
node skills/feishu-task/index.js create --summary "Review PR #123" --due "2023-12-31T18:00:00Z" --origin "OpenClaw"

# Complete a task
node skills/feishu-task/index.js complete --task_id "t_12345"

# Delete a task
node skills/feishu-task/index.js delete --task_id "t_12345"
```

## Options

- `create`:
  - `--summary`: Task title/content.
  - `--description`: Detailed description (optional).
  - `--due`: Due date/time (ISO 8601 or timestamp).
  - `--origin`: Origin source description.
  - `--user_id`: Assignee User ID (optional).
- `complete`:
  - `--task_id`: The ID of the task to complete.
- `delete`:
  - `--task_id`: The ID of the task to delete.
