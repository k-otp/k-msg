# Express Node: Send Only

Node.js + Express send template with:

- advanced send route (`POST /send`) using raw `SendInput` JSON (single or batch)
- SMS shortcut route (`POST /send/sms`)
- provider: IWINV

## Setup

```bash
cd examples/express-node-send-only
bun install
cp .env.example .env
```

Fill `.env`:

```ini
IWINV_API_KEY=...
IWINV_SMS_API_KEY=...
IWINV_SMS_AUTH_KEY=...
IWINV_SMS_SENDER_NUMBER=01000000000
PORT=3000
```

## Run

```bash
set -a; source .env; set +a
bun run dev
```

## Routes

- `POST /send` (advanced single/batch)
- `POST /send/sms`

For batch requests to `POST /send`, the route always returns `200`.
Check per-item success/failure in `data.results`.

## Sample requests

Advanced send (single):

```bash
curl -X POST http://127.0.0.1:3000/send \
  -H "content-type: application/json" \
  -d '{
    "type":"SMS",
    "to":"01012345678",
    "text":"hello from express advanced route",
    "from":"01000000000",
    "providerId":"iwinv"
  }'
```

Advanced send (batch):

```bash
curl -X POST http://127.0.0.1:3000/send \
  -H "content-type: application/json" \
  -d '[
    {
      "type":"SMS",
      "to":"01012345678",
      "text":"hello from express advanced route #1",
      "from":"01000000000",
      "providerId":"iwinv"
    },
    {
      "type":"SMS",
      "to":"01012345679",
      "text":"hello from express advanced route #2",
      "from":"01000000000",
      "providerId":"iwinv"
    }
  ]'
```

SMS shortcut send:

```bash
curl -X POST http://127.0.0.1:3000/send/sms \
  -H "content-type: application/json" \
  -d '{
    "to":"01012345678",
    "text":"hello from express",
    "from":"01000000000"
  }'
```
