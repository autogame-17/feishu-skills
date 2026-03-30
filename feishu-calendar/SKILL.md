---
name: feishu-calendar
description: Manage Feishu (Lark) calendars including listing, searching, syncing events, creating calendar entries from task requests, and setting up shared project calendars.
---

# feishu-calendar

Manage Feishu (Lark) calendars -- list, search, sync events, create entries, and set up shared calendars.

## Prerequisites

- `feishu-common` installed with valid `FEISHU_APP_ID` and `FEISHU_APP_SECRET`.

## Commands

### List Calendars

Check available calendars and their IDs.

```bash
node skills/feishu-calendar/list_test.js
```

### Search Calendar

Find a calendar by name/summary.

```bash
node skills/feishu-calendar/search_cal.js
```

### Check Master's Calendar

Specific check for the Master's calendar status.

```bash
node skills/feishu-calendar/check_master.js
```

### Sync Events

Sync calendar events to local state/memory:

```bash
node skills/feishu-calendar/sync_routine.js
```

### Create Event

```bash
node skills/feishu-calendar/create.js --summary "Task: <Title>" --desc "<Context>" --start "<ISO>" --end "<ISO+1h>" --attendees "<User_ID>"
```

### Setup Shared Calendar

Create a shared project calendar and add members:

```bash
node skills/feishu-calendar/setup_shared.js --name "Project Name" --desc "Description" --members "ou_1,ou_2" --role "writer"
```

## Task Marking Protocol

**Trigger**: User says "Mark this task" or "Remind me to...".

1. Extract date/time from the request (e.g., "Feb 4th" becomes `YYYY-02-04`).
2. Run `create.js` with `--summary "Task: <Title>"`, `--attendees` set to the requester's ID, and a 1-hour default duration.
