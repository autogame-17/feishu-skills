# Feishu Doc Search Skill

## Description

Searches the Feishu (Lark) Drive for documents matching a query. Uses the Feishu Drive Search API to find docs, sheets, and other file types. Returns a JSON array of matches with token, name, type, and URL for each file. Requires a Feishu app with Drive read permissions.

## When to Use

- Finding documents by keyword when you do not know the exact name or location
- Integrating Feishu document discovery into agent workflows
- Building tools that need to locate and link to Feishu docs
- Searching across all accessible Drive files for a term

## Usage

```bash
node skills/feishu-doc-search/index.js --query "search term"
```

### Example

```bash
node skills/feishu-doc-search/index.js --query "Q4 roadmap"
```

## Options and Arguments

| Option | Required | Description |
|--------|----------|-------------|
| `--query` | Yes | Search keyword or phrase |

The search is limited to 5 results by default (hardcoded in the Drive API call). The search type is `doc` (documents); the code can be extended to support sheet, bitable, mindnote, file, slide, wiki.

## Output Format

Prints a JSON array to stdout:

```json
[
  {
    "token": "doc_token",
    "name": "Document Name",
    "type": "doc",
    "url": "https://..."
  }
]
```

If no documents are found, prints "No documents found." Errors are written to stderr and exit code is 1.

## Configuration

Loads `.env` from workspace root. Required variables:

| Variable | Description |
|----------|-------------|
| `FEISHU_APP_ID` | Feishu application ID |
| `FEISHU_APP_SECRET` | Feishu application secret |

The skill uses `feishu-common` for token acquisition. The Feishu app must have Drive read scope to search files.

## Dependencies

- Node.js
- `axios` (^1.6.0)
- `dotenv` (^16.3.1)
- `skills/feishu-common` (getToken)
