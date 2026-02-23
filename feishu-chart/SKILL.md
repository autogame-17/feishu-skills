# Feishu Chart Skill

Generate and send charts to Feishu (Lark) chats using QuickChart.io as the backend renderer.
Outputs a PNG image sent via `feishu-image`.

## Usage

```bash
# Send a simple test chart
node skills/feishu-chart/index.js --target "oc_xxx" --title "Monthly Sales" --type bar

# Send custom data from JSON file
node skills/feishu-chart/index.js --target "oc_xxx" --file data.json --width 800 --height 400

# Send custom data inline (escaped JSON)
node skills/feishu-chart/index.js --target "ou_xxx" --data '{"type":"pie","data":{...}}'
```

## Options

- `-t, --target <id>`: Target Feishu ID (User `ou_...` or Group `oc_...`)
- `-d, --data <json>`: Chart configuration JSON (Chart.js format)
- `-f, --file <path>`: Path to a file containing the Chart JSON
- `--title <text>`: Title for the default chart (if no data provided)
- `--type <type>`: Chart type for default chart (bar, line, pie, radar)
- `--width <pixels>`: Image width (default: 500)
- `--height <pixels>`: Image height (default: 300)
- `--test`: Generate the image locally but do not send (for debugging)

## Dependencies

- `feishu-image` skill must be installed and configured.
- `axios`, `commander`, `fs-extra` (install via `npm install` in skill dir)
