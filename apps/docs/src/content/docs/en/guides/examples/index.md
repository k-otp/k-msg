---
title: Example Guides
description: Choose the starter example that matches your runtime and delivery goal.
---

This hub helps you choose the right example by runtime and goal.

- OTP request and verification: [node-express-otp](/en/guides/examples/node-express-otp/)
- AlimTalk order notifications with delivery tracking: [bun-order-notifications](/en/guides/examples/bun-order-notifications/)
- Cloudflare: [cloudflare-worker-d1](/en/guides/examples/cloudflare-worker-d1/) (tracking and webhooks), [cloudflare-worker-queue-do](/en/guides/examples/cloudflare-worker-queue-do/) (queue), [cloudflare-worker-hyperdrive](/en/guides/examples/cloudflare-worker-hyperdrive/) (Postgres)

## Quick picks

| Goal | Recommended example | Pick it first when |
| --- | --- | --- |
| OTP and verification codes | [node-express-otp](/en/guides/examples/node-express-otp/) | You need a Node backend that sends and verifies codes safely |
| AlimTalk with SMS fallback | [bun-order-notifications](/en/guides/examples/bun-order-notifications/) | You send order or shipping updates and want to know they arrived |
| Tracking and status webhooks on Workers | [cloudflare-worker-d1](/en/guides/examples/cloudflare-worker-d1/) | You run on Cloudflare and push status changes to other services |
| Queued sending on Workers | [cloudflare-worker-queue-do](/en/guides/examples/cloudflare-worker-queue-do/) | You want sends decoupled from requests, with idempotent retries |
| Tracking in Postgres on Workers | [cloudflare-worker-hyperdrive](/en/guides/examples/cloudflare-worker-hyperdrive/) | Your tracking data belongs in an existing Postgres database |

## Recommended reading path

- New users: follow one send end to end in [node-express-otp](/en/guides/examples/node-express-otp/), then AlimTalk, fallback, and tracking in [bun-order-notifications](/en/guides/examples/bun-order-notifications/)
- Cloudflare-focused teams: [cloudflare-worker-d1](/en/guides/examples/cloudflare-worker-d1/) -> [cloudflare-worker-queue-do](/en/guides/examples/cloudflare-worker-queue-do/), and [cloudflare-worker-hyperdrive](/en/guides/examples/cloudflare-worker-hyperdrive/) when tracking must live in Postgres
- Webhook-driven systems: start with the signed status webhooks and verifying receiver in [cloudflare-worker-d1](/en/guides/examples/cloudflare-worker-d1/)

## Example directory

- [bun-order-notifications](/en/guides/examples/bun-order-notifications/): Order notifications on Bun: AlimTalk with SMS fallback, batches, and SQLite delivery tracking.
- [cloudflare-worker-d1](/en/guides/examples/cloudflare-worker-d1/): Workers + D1: delivery tracking on a cron and signed webhooks for status changes.
- [cloudflare-worker-hyperdrive](/en/guides/examples/cloudflare-worker-hyperdrive/): Workers + Hyperdrive: delivery tracking in Postgres with cron polling.
- [cloudflare-worker-queue-do](/en/guides/examples/cloudflare-worker-queue-do/): Workers + Durable Objects: an idempotent send queue with retries.
- [node-express-otp](/en/guides/examples/node-express-otp/): OTP request and verification on Node + Express.
