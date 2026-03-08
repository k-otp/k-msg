---
title: Package Guides
description: Quickly choose the right k-msg package entry point for your project.
---

This hub helps you choose the right package entry point quickly.

- Read first: [Package Selection](/en/guides/package-selection/)
- Default starting point for most users: [k-msg](/en/guides/packages/k-msg/)
- Drop lower when you need custom wiring: [@k-msg/core](/en/guides/packages/core/)

## Quick picks

| What you need now | Start with | Usually paired with |
| --- | --- | --- |
| Send messages from an application | [k-msg](/en/guides/packages/k-msg/) | [@k-msg/provider](/en/guides/packages/provider/) |
| Implement a custom provider or control low-level behavior | [@k-msg/core](/en/guides/packages/core/) | [@k-msg/provider](/en/guides/packages/provider/), [@k-msg/messaging](/en/guides/packages/messaging/) |
| Queueing, delivery tracking, or runtime adapters | [@k-msg/messaging](/en/guides/packages/messaging/) | [k-msg](/en/guides/packages/k-msg/), [@k-msg/provider](/en/guides/packages/provider/) |
| Heavy template parsing and interpolation | [@k-msg/template](/en/guides/packages/template/) | [k-msg](/en/guides/packages/k-msg/) |
| Channel or sender-number admin tooling | [@k-msg/channel](/en/guides/packages/channel/) | [@k-msg/provider](/en/guides/packages/provider/) |
| Webhook runtime and retry flows | [@k-msg/webhook](/en/guides/packages/webhook/) | [@k-msg/messaging](/en/guides/packages/messaging/) |
| Reporting on delivery tracking data | [@k-msg/analytics](/en/guides/packages/analytics/) | [@k-msg/messaging](/en/guides/packages/messaging/) |

## Recommended reading path

- Most application teams: [Package Selection](/en/guides/package-selection/) -> [k-msg](/en/guides/packages/k-msg/) -> [Provider Selection](/en/guides/provider-selection/) -> [Examples](/en/guides/examples/)
- Platform or infrastructure teams: [@k-msg/core](/en/guides/packages/core/) -> [@k-msg/messaging](/en/guides/packages/messaging/) -> [@k-msg/provider](/en/guides/packages/provider/)
- Admin or operations tooling teams: [@k-msg/channel](/en/guides/packages/channel/) -> [@k-msg/webhook](/en/guides/packages/webhook/) -> [@k-msg/analytics](/en/guides/packages/analytics/)

## Package directory

- [@k-msg/analytics](/en/guides/packages/analytics/): Reporting and aggregation on top of delivery tracking data.
- [@k-msg/channel](/en/guides/packages/channel/): Provider-aware channel lifecycle helpers and in-memory toolkit helpers.
- [@k-msg/core](/en/guides/packages/core/): Low-level types, Result, errors, and resilience primitives.
- [@k-msg/messaging](/en/guides/packages/messaging/): Routing, queueing, delivery tracking, and runtime adapters behind KMsg.
- [@k-msg/provider](/en/guides/packages/provider/): Built-in provider implementations and onboarding metadata.
- [@k-msg/template](/en/guides/packages/template/): Template parsing, interpolation, lifecycle, and toolkit utilities.
- [@k-msg/webhook](/en/guides/packages/webhook/): Webhook runtime, persistence, retries, and Cloudflare adapters.
- [k-msg](/en/guides/packages/k-msg/): Unified facade most apps should start with.
