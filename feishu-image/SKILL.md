# Feishu Image Skill

上传并发送图片到飞书聊天或用户。支持缓存 `image_key`，避免重复上传同一文件。

## 使用方式

```bash
node skills/feishu-image/send.js --target <chat_id_or_user_id> --file <path_to_image>
# 或者直接发送网络图片（自动下载）
node skills/feishu-image/send.js --target <chat_id_or_user_id> --url <image_url>
```

## 参数
- `--target`: 用户 OpenID（`ou_...`）或群 ChatID（`oc_...`）
- `--file`: 本地图片路径
- `--url`: 网络图片 URL（可选，自动下载并发送）

## 配置
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
