---
npm/@k-msg/core: minor
---

Align IWINV onboarding/default behavior across core/provider/messaging/CLI:

- Make IWINV onboarding config checks require `apiKey` only (no `baseUrl` requirement), while keeping provider-internal default endpoints.
- Remove `defaults.from` fallback at messaging/CLI runtime so sender resolution is per-message or provider-level config.
- Treat Kakao channel alias `senderKey` as optional in CLI config and avoid forcing `IWINV_SENDER_KEY` for IWINV flows.
- Use raw GitHub schema URLs in generated CLI configs and schema metadata, and stop publishing schema files via Pages.
