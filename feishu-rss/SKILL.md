# Feishu RSS Skill

Subscribe to RSS/Atom feeds and push updates to Feishu groups as rich cards.

## Features

- **Add Feeds:** Subscribe to any RSS/Atom URL.
- **List Feeds:** View all active subscriptions.
- **Check Feeds:** Poll for new items (last 24h) and send notifications.
- **Remove Feeds:** Unsubscribe by ID.
- **Import/Export:** Support OPML format (planned).

## Usage

```bash
# Add a feed
node skills/feishu-rss/index.js add "https://news.ycombinator.com/rss" --name "Hacker News" --target "oc_xxx"

# List feeds
node skills/feishu-rss/index.js list

# Check for updates (run via cron)
node skills/feishu-rss/index.js check

# Remove a feed
node skills/feishu-rss/index.js remove <id>
```

## Configuration

Feeds are stored in `skills/feishu-rss/feeds.json`.
Processed items are tracked in `memory/rss_history.json` to prevent duplicates.

## Dependencies

- `rss-parser` (npm)
- `feishu-card` (for sending updates)
