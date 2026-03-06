---
title: "Package Selection"
description: "Choose the smallest k-msg package set for your project."
---

K-Message is modular. You do not need every package in every app. This guide maps common project shapes to the package set that usually fits best.

## Default recommendation

Most applications should start with:

- `k-msg`
- `@k-msg/provider`

That gives you the unified send facade plus built-in provider implementations.

## Package roles

| Package | Use it when | Typical consumer |
| --- | --- | --- |
| `k-msg` | You want the main send API and standard app wiring | Most application teams |
| `@k-msg/core` | You need low-level types, Result helpers, or custom provider work | Libraries and advanced integrations |
| `@k-msg/messaging` | You need queueing, delivery tracking, or runtime adapters | Background workers and infrastructure services |
| `@k-msg/provider` | You want built-in provider implementations | Most production apps |
| `@k-msg/template` | You manage template parsing, interpolation, or validation directly | Template-heavy apps |
| `@k-msg/channel` | You need provider-aware channel lifecycle helpers | Provider onboarding or admin tooling |
| `@k-msg/webhook` | You build webhook ingestion and delivery runtime flows | Platform or backend services |
| `@k-msg/analytics` | You aggregate tracking data into dashboards or reports | Reporting pipelines |

## Common setups

### 1. Simple application sending SMS or AlimTalk

Install:

```bash
bun add k-msg @k-msg/provider
```

Choose this when:

- your app sends messages directly
- you do not need custom queue orchestration yet
- you want the smallest learning surface

### 2. Application with custom queueing or delivery tracking

Install:

```bash
bun add k-msg @k-msg/provider @k-msg/messaging
```

Choose this when:

- you want background processing
- you need runtime adapters for Bun, Node, or Cloudflare
- you persist delivery state outside the main request path

### 3. Platform team building provider-aware or reusable primitives

Install:

```bash
bun add @k-msg/core @k-msg/provider @k-msg/messaging
```

Choose this when:

- you are building abstractions on top of K-Message
- you need direct access to Result, error, or queue primitives
- your app already has its own orchestration layer

### 4. Template-heavy Kakao workflows

Add `@k-msg/template` when:

- you validate template payloads before sending
- you run custom interpolation or button parsing
- you manage template lifecycle outside provider dashboards

### 5. Webhook-heavy deployments

Add `@k-msg/webhook` when:

- you need webhook endpoint registries
- you want retry and persistence helpers around webhook delivery
- you are deploying runtime webhook infrastructure, especially on Cloudflare

## Runtime adapter note

Some capabilities live behind runtime-specific subpaths. For example:

- `k-msg/adapters/bun`
- `k-msg/adapters/node`
- `k-msg/adapters/cloudflare`
- `@k-msg/messaging/adapters/cloudflare`

Pick these only when your runtime needs them.

## Decision checklist

Start with `k-msg` if all of these are true:

- you are building an application, not a library
- you want a stable top-level send API
- built-in provider integrations are enough

Drop to lower-level packages if any of these are true:

- you need your own provider implementation
- you want to control queueing and tracking separately
- you are composing a reusable platform layer for multiple apps

## Next steps

- [Package Guides](/en/guides/packages/) for package-by-package details
- [Provider Selection](/en/guides/provider-selection/) for choosing the right backend provider
- [Examples](/en/guides/examples/) for runtime-specific starter projects
