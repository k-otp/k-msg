# Examples

Each example is a small app built around one real use case, written the way you would ship it. All of them run offline with the mock provider (`KMSG_PROVIDER=mock`, the default) and switch to IWINV, SOLAPI, or Aligo through environment variables.

| Example | Runtime | What it shows |
| --- | --- | --- |
| [`node-express-otp`](./node-express-otp) | Node + Express | OTP request and verification: hashed codes, expiry, cooldowns, and attempt limits |
| [`bun-order-notifications`](./bun-order-notifications) | Bun + Hono | AlimTalk with SMS fallback, routing by message type, capped batches, and SQLite delivery tracking |
| [`cloudflare-worker-d1`](./cloudflare-worker-d1) | Cloudflare Workers + D1 | Delivery tracking on a cron, signed webhooks for status changes, and a receiver that verifies them |
| [`cloudflare-worker-queue-do`](./cloudflare-worker-queue-do) | Cloudflare Workers + Durable Objects | An idempotent send queue with retries and cleanup |
| [`cloudflare-worker-hyperdrive`](./cloudflare-worker-hyperdrive) | Cloudflare Workers + Hyperdrive | Delivery tracking in Postgres with cron polling |

## Shared conventions

- Configuration is validated once at startup (`src/env.ts`) and fails with a message that names what is missing. Only the selected provider's credentials are required.
- The server owns the sender number and the message content. Endpoints accept domain input (a phone number, an order) and never forward request bodies to `kmsg.send`.
- Errors are returned as `{ "error": { "code", "message" } }` with a status code mapped from the `KMsgError` code (400, 429, 502, 503). Provider error details stay out of responses.
- Admin endpoints require `Authorization: Bearer <token>` and refuse requests when no token is configured.
- Provider calls get a timeout through `kmsg.send(input, { signal: AbortSignal.timeout(...) })`.

## Validation

- `bun run typecheck` at the repository root checks every example against the current package sources, through each example's `tsconfig.workspace.json`.
- `bun run examples:standalone` copies each example to a temporary directory, installs its dependencies from npm (the `latest` tag), and runs its `typecheck` script, as `.github/workflows/examples-standalone.yml` does:

```bash
bun run examples:standalone
bun run examples:standalone --example node-express-otp
```
