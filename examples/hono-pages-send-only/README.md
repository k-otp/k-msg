# Hono Pages: Send Only

Cloudflare Pages Functions + Hono send template with:

- advanced send route (`POST /send`) using raw `SendInput` JSON
- SMS shortcut route (`POST /send/sms`)

## Install

```bash
cd examples/hono-pages-send-only
bun install
```

## Configure

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Fill IWINV provider secrets.

## Run

```bash
bun run dev
```

## Endpoint

- `POST /send` (advanced)
- `POST /send/sms`

Advanced request body (raw `SendInput`):

```json
{
  "type": "SMS",
  "to": "01012345678",
  "text": "hello from advanced route",
  "from": "01000000000",
  "providerId": "iwinv"
}
```

SMS shortcut request body:

```json
{
  "to": "01012345678",
  "text": "hello",
  "from": "01000000000"
}
```
