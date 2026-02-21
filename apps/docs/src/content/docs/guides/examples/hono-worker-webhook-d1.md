---
title: "hono-worker-webhook-d1 (Example)"
description: "Generated from `examples/hono-worker-webhook-d1/README.md`"
---
> 한국어 번역본이 없어 영문 예제 문서를 표시합니다.

Cloudflare Workers + Hono example for:

- easy webhook endpoint registration (`POST /webhook/endpoints`)
- immediate event emit (`POST /webhook/events/emit`)
- D1-backed endpoint/delivery persistence
- local receiver route for end-to-end verification (`POST /webhook/receiver/local`)

## Setup

```bash
cd examples/hono-worker-webhook-d1
bun install
```

## D1 binding

Update `wrangler.jsonc`:

- `d1_databases[0].database_name`
- `d1_databases[0].database_id`

## Run local dev

```bash
bun run dev
```

## Routes

- `GET /`
- `POST /webhook/endpoints`
- `GET /webhook/endpoints`
- `POST /webhook/events/emit`
- `POST /webhook/receiver/local`

## Quick flow

1. Register an endpoint that points to local receiver:

```bash
curl -X POST http://127.0.0.1:8787/webhook/endpoints \
  -H "content-type: application/json" \
  -d '{
    "url": "http://127.0.0.1:8787/webhook/receiver/local",
    "name": "local-receiver",
    "events": ["message.sent", "message.failed"]
  }'
```

2. Emit an event:

```bash
curl -X POST http://127.0.0.1:8787/webhook/events/emit \
  -H "content-type: application/json" \
  -d '{
    "type": "message.sent",
    "messageId": "msg_123",
    "providerId": "iwinv",
    "payload": { "text": "hello webhook" }
  }'
```

3. List endpoints:

```bash
curl http://127.0.0.1:8787/webhook/endpoints
```

The receiver route response includes headers/body so you can verify delivery quickly.

