---
title: "Order shipping notifications with Bun and Hono"
description: "Generated from `examples/bun-order-notifications/README.md`"
---
An internal service that tells customers their order has shipped. Your order
system calls `POST /orders/:orderId/shipped`, or the batch endpoint for up to
100 orders, and the service sends a KakaoTalk AlimTalk from an approved
template, carrying the same text as an SMS or LMS fallback for customers who
do not use KakaoTalk. Every send is tracked in SQLite, so
`GET /notifications/:messageId` can tell whether it arrived when the provider
reports delivery status. It shows k-msg's
`routing.byType` (AlimTalk and SMS can go through different providers), KMsg
defaults for the Kakao sender profile, one batch send with per-order outcomes,
delivery tracking with the Bun SQLite store and a status-change callback,
tracking-based fallback sends, bearer-token authentication, provider timeouts
and a graceful shutdown.

## Run it locally

Requires Bun 1.3 or later. The default `mock` provider needs no credentials and
sends nothing, but reports every message as delivered, so tracking works
offline.

```bash
cd examples/bun-order-notifications
bun install
cp .env.example .env
sed -i.bak "s/^API_TOKEN=.*/API_TOKEN=$(openssl rand -hex 32)/" .env && rm .env.bak
bun run dev
```

In a second terminal, from the same directory, send a notification and keep its
id:

```bash
export API_TOKEN=$(sed -n 's/^API_TOKEN=//p' .env)

MESSAGE_ID=$(curl -s -X POST http://localhost:3000/orders/ORD-1001/shipped \
  -H "Authorization: Bearer $API_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"phone":"010-1234-5678","customerName":"Minji Kim","trackingNumber":"123456789012"}' \
  | sed -E 's/.*"messageId":"([^"]+)".*/\1/')
echo "$MESSAGE_ID"
```

Look up its status:

```bash
curl "http://localhost:3000/notifications/$MESSAGE_ID" \
  -H "Authorization: Bearer $API_TOKEN"
```

It reads `"status":"SENT"` at first. Tracking polls a message 30 seconds after
it was sent; then the status becomes `"DELIVERED"` and the server logs
`[tracking] <messageId> ALIMTALK to 010******78: SENT -> DELIVERED`. Records
live in `./data/tracking.db` and survive restarts.

Notify several orders in one call:

```bash
curl -X POST http://localhost:3000/orders/shipped/batch \
  -H "Authorization: Bearer $API_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"orders":[
    {"orderId":"ORD-1002","phone":"010-1111-2222","customerName":"Jae","trackingNumber":"555566667777"},
    {"orderId":"ORD-1003","phone":"010-3333-4444","customerName":"Hana","trackingNumber":"888899990000"}
  ]}'
```

## Use a real provider

Set these in `.env`:

- `KMSG_PROVIDER`: the provider that sends the AlimTalk.
- `KMSG_SMS_PROVIDER`: the provider for SMS and LMS. Leave it empty to use
  `KMSG_PROVIDER` for both.
- `KMSG_SENDER_NUMBER`: a sender number registered with your providers, digits
  only. The SMS or LMS fallback comes from it.
- `ALIMTALK_TEMPLATE_ID`: the code of your approved AlimTalk template. Its text
  must match `SHIPPED_TEMPLATE` in `src/notifier.ts` exactly, so change both
  together:

  ```text
  #{customerName}, your order #{orderId} has shipped.
  Tracking number: #{trackingNumber}
  ```

Then the variables of each provider you selected:

| Provider | Sending the AlimTalk | Sending SMS and LMS |
| --- | --- | --- |
| `iwinv` | `IWINV_API_KEY` | `IWINV_API_KEY`, `IWINV_SMS_API_KEY`, `IWINV_SMS_AUTH_KEY`, `IWINV_SMS_COMPANY_ID` (IWINV's SMS status API needs the company id) |
| `solapi` | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `KAKAO_PROFILE_ID` (the pfId), `KAKAO_PLUS_ID` (the channel ID, such as `@myshop`; k-msg requires it for SOLAPI) | `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` |
| `aligo` | `ALIGO_API_KEY`, `ALIGO_USER_ID`, `KAKAO_PROFILE_ID` (the sender key) | `ALIGO_API_KEY`, `ALIGO_USER_ID` |

`ALIGO_TEST_MODE=true` makes Aligo validate requests without sending them, and
`TRACKING_DB_PATH` moves the SQLite file. Only the selected providers'
variables are read; if anything is missing or invalid, the server exits at
startup and lists every problem. IWINV also rejects requests from IP addresses
that are not registered in its console.

How the fallback is delivered depends on the AlimTalk provider. IWINV, SOLAPI
and Aligo send the LMS themselves when the AlimTalk cannot be delivered. When
SOLAPI reports that an AlimTalk failed because the customer does not use
KakaoTalk, tracking also sends the LMS once through `KMSG_SMS_PROVIDER`. The
mock always reports delivery, so no fallback is sent locally.

k-msg cannot poll Aligo for delivery status, so with Aligo a notification
stays `SENT` and turns `UNKNOWN` after 24 hours.

## Endpoints

Every endpoint requires `Authorization: Bearer <API_TOKEN>` and answers
`401 UNAUTHORIZED` without it. Errors always have the shape
`{"error":{"code":"...","message":"..."}}`. Malformed JSON gets
`400 INVALID_JSON`, a body over 64 KB gets `413 PAYLOAD_TOO_LARGE`, and an
unknown path gets `404 NOT_FOUND`.

### `POST /orders/:orderId/shipped`

Body: `{"phone":"010-1234-5678","customerName":"Minji Kim","trackingNumber":"123456789012"}`.
`orderId` is 1 to 64 letters, digits, `-` or `_`; `phone` is a Korean mobile
number; `customerName` is 1 to 50 characters; `trackingNumber` is 6 to 30
letters, digits or `-`.

| Status | Meaning |
| --- | --- |
| `202` | `{"messageId":"..."}`: the provider accepted the AlimTalk |
| `400` | `INVALID_REQUEST`, with every problem in the message |
| `429` | `RATE_LIMITED`: the provider is rate limiting sends |
| `502` | `PROVIDER_ERROR`: the provider refused the send, usually because of credentials, balance, the template or the sender number. The server log has the provider's message. |
| `503` | `PROVIDER_UNAVAILABLE`: a network error or the 10-second timeout; try again later |

### `POST /orders/shipped/batch`

Body: `{"orders":[{"orderId":"...","phone":"...","customerName":"...","trackingNumber":"..."}]}`
with 1 to 100 orders and no repeated `orderId`. If any order is invalid, the
whole batch is rejected with `400 INVALID_REQUEST`. Otherwise the orders go out
in one KMsg batch with a 30-second timeout, and the answer is `200` with one
result per order, in request order:

```json
{
  "total": 2,
  "sent": 1,
  "failed": 1,
  "results": [
    { "orderId": "ORD-1002", "ok": true, "messageId": "..." },
    {
      "orderId": "ORD-1003",
      "ok": false,
      "error": { "code": "PROVIDER_UNAVAILABLE", "message": "..." }
    }
  ]
}
```

A failed order carries the same codes as a single send.

### `GET /notifications/:messageId`

```json
{
  "messageId": "...",
  "type": "ALIMTALK",
  "to": "010******78",
  "status": "DELIVERED",
  "requestedAt": "2026-09-26T13:27:31.532Z",
  "statusUpdatedAt": "2026-09-26T13:28:05.245Z",
  "deliveredAt": "2026-09-26T13:27:31.533Z"
}
```

`status` is `SENT` until the first poll, then `DELIVERED` or `FAILED` (with
`failedAt`) as the provider reports. It becomes `UNKNOWN` when the provider
returned no message id to poll with, or reported no final status within 24
hours. An unknown id gets `404 NOT_FOUND`.

## Production checklist

- Make the notification idempotent per order: record the shipped event for an
  `orderId` in your database before sending, so a retried call from the order
  system does not text the customer twice. This example sends on every call.
- When you run more than one instance, move tracking to a shared database
  (`BunSqlDeliveryTrackingStore` from `@k-msg/messaging/adapters/bun` works
  with Postgres and MySQL through `Bun.SQL`) and call `tracking.start()` in
  one process only.
- The tracking table stores recipient numbers in plain text. Restrict access
  to it, or configure the store's `fieldCrypto` option, and delete rows you no
  longer need.
- Give each caller its own token if you need to revoke one without the others;
  this example accepts a single `API_TOKEN`.
- SOLAPI's SDK does not accept an abort signal, so the timeouts do not cut
  SOLAPI calls short.

