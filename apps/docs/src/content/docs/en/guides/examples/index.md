---
title: Example Guides
description: Choose the starter example that matches your runtime and delivery goal.
---

This hub helps you choose the right example by runtime and goal.

- First send-only check: [express-node-send-only](/en/guides/examples/express-node-send-only/)
- Cloudflare queue/tracking: [hono-worker-queue-do](/en/guides/examples/hono-worker-queue-do/), [hono-worker-tracking-d1](/en/guides/examples/hono-worker-tracking-d1/)
- Webhook runtime: [hono-worker-webhook-d1](/en/guides/examples/hono-worker-webhook-d1/)

## Quick picks

| Goal | Recommended example | Pick it first when |
| --- | --- | --- |
| Fastest send-only proof | [express-node-send-only](/en/guides/examples/express-node-send-only/) | You want the shortest path on Node |
| Lightweight Bun API server | [hono-bun-send-only](/en/guides/examples/hono-bun-send-only/) | You are building with Bun + Hono |
| Send-only deploy on Pages Functions | [hono-pages-send-only](/en/guides/examples/hono-pages-send-only/) | You want the simplest Cloudflare Pages entry point |
| Queue processing on Workers | [hono-worker-queue-do](/en/guides/examples/hono-worker-queue-do/) | You need Durable Objects-based async processing |
| Delivery tracking on Workers + D1 | [hono-worker-tracking-d1](/en/guides/examples/hono-worker-tracking-d1/) | You want Cloudflare-native tracking storage |
| Delivery tracking on Pages + Hyperdrive | [hono-pages-tracking-hyperdrive](/en/guides/examples/hono-pages-tracking-hyperdrive/) | You are staying on Pages but need Hyperdrive |
| Webhook ingestion and runtime operations | [hono-worker-webhook-d1](/en/guides/examples/hono-worker-webhook-d1/) | You need event intake, retries, and persistence |

## Recommended reading path

- New users: start with [express-node-send-only](/en/guides/examples/express-node-send-only/) or [hono-bun-send-only](/en/guides/examples/hono-bun-send-only/) to validate the send-only flow first
- Cloudflare-focused teams: [hono-pages-send-only](/en/guides/examples/hono-pages-send-only/) -> [hono-worker-queue-do](/en/guides/examples/hono-worker-queue-do/) -> [hono-worker-tracking-d1](/en/guides/examples/hono-worker-tracking-d1/)
- Webhook-heavy systems: start with [hono-worker-webhook-d1](/en/guides/examples/hono-worker-webhook-d1/) and pair it with [hono-worker-tracking-d1](/en/guides/examples/hono-worker-tracking-d1/) when you also need delivery state

## Example directory

- [express-node-send-only](/en/guides/examples/express-node-send-only/): Minimal Node + Express send-only server.
- [hono-bun-send-only](/en/guides/examples/hono-bun-send-only/): Fast Bun + Hono send-only API.
- [hono-pages-send-only](/en/guides/examples/hono-pages-send-only/): Cloudflare Pages Functions send-only starter.
- [hono-pages-tracking-hyperdrive](/en/guides/examples/hono-pages-tracking-hyperdrive/): Pages + Hyperdrive example with delivery tracking.
- [hono-worker-queue-do](/en/guides/examples/hono-worker-queue-do/): Workers + Durable Objects queue processing example.
- [hono-worker-tracking-d1](/en/guides/examples/hono-worker-tracking-d1/): Workers + D1 delivery tracking example.
- [hono-worker-webhook-d1](/en/guides/examples/hono-worker-webhook-d1/): Workers + D1 webhook runtime example.
