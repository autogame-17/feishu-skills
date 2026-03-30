---
name: feishu-calendar
description: "Manage Feishu (Lark) calendars including listing calendars, searching by name, checking schedules, syncing events to local state, creating calendar events from task requests, and setting up shared project calendars. Use when listing available calendars, creating events or reminders, syncing calendar data, setting up shared calendars, or converting user task requests into calendar entries."
---

# feishu-calendar

Manage Feishu (Lark) calendars — list, search, sync events, create entries, and set up shared calendars.

## Prerequisites

- `feishu-common` installed with valid `FEISHU_APP_ID` and `FEISHU_APP_SECRET`.

## Commands

### List Calendars

```bash
node skills/feishu-calendar/list_test.js
```

### Search by Name

```bash
node skills/feishu-calendar/search_cal.js
```

### Check Schedule Status

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

When a user says "Mark this task" or "Remind me to...":

1. Extract date/time from the request (e.g., "Feb 4th" becomes `YYYY-02-04`).
2. Run `create.js` with `--summary "Task: <Title>"`, `--attendees` set to the requester's ID, and a 1-hour default duration.
