---
npm/@k-msg/webhook: minor
---

**Breaking (pre-1.0 minor):** the default HTTP client no longer delivers to arbitrary public hosts. It delivers only to hosts listed in `delivery.allowedHosts`. `addEndpoint()`, `addEndpoints()` and `updateEndpoint()` throw `WebhookHostNotAllowedError` for any other host, so it fails when you register the endpoint instead of storing one whose every delivery fails. With an injected `httpClient`, nothing is checked: that client decides.

Upgrade notes:

- Add your receivers' exact hostnames to `delivery.allowedHosts` (no scheme, port, path or wildcard; IPv6 in brackets; internationalized names as punycode). An entry trusts every port of the host and the host's DNS operator: names are checked, addresses are not pinned. For arbitrary customer URLs, inject a DNS-pinned or egress-filtered `httpClient`.
- `new WebhookRuntimeService({ security: { allowPrivateHosts: true } })` without an `httpClient` now throws at construction ("Private webhook destinations require an explicitly configured HTTP client"). Pass an `httpClient` for local development, or drop the option and list the host in `allowedHosts`.
- The stored `responseBody` of a delivery attempt is the first 4096 bytes of the response (`maxResponseBodyBytes`, `0` keeps none, at most 1 MiB), and `responseBodyTruncated` marks a cut.
- Endpoints stored before the change are not rechecked: if their host is not listed, their deliveries fail as untrusted.

```ts
// Before: delivered to any public HTTPS host.
new WebhookRuntimeService({ delivery: config, persistence });

// After:
new WebhookRuntimeService({
  delivery: { ...config, allowedHosts: ["hooks.example.com"] },
  persistence,
});
```
