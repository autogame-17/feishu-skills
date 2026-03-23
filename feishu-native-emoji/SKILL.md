---
name: feishu-native-emoji
description: Feishu native emoji mapping -- emoji_type codes, Chinese names, and Unicode conversion table for card markdown.
tags: [feishu, emoji, ui, markdown]
---

# Feishu Native Emoji

Feishu has its own emoji system separate from Unicode. In card markdown, use `:emoji_type:` syntax (e.g. `:THUMBSUP:`, `:SMILE:`, `:Fire:`).

## Card Markdown Syntax

```
:OK: :THUMBSUP: :SMILE: :Fire: :DONE: :HEART: :PARTY:
```

Renders as native Feishu emoji icons. See [official docs](https://open.feishu.cn/document/uAjLw4CM/ukzMukzMukzM/feishu-cards/card-components/content-components/rich-text).

## Rich Text (Post) Syntax

```json
{ "tag": "emotion", "emoji_type": "SMILE" }
```

## Reaction API

```json
{ "reaction_type": { "emoji_type": "THUMBSUP" } }
```

## Resources

- `emoji_list.txt`: Chinese display names (e.g. `[微笑]`)
- `emoji_type_list.txt`: English API codes (e.g. `SMILE`)
- `unicode_mapping.json`: Unicode char -> emoji_type mapping for auto-conversion

## Integration

When building Feishu messages, convert Unicode emoji to `:emoji_type:` format.
The `unicode_mapping.json` provides a ready-to-use lookup table.
