---
npm/@k-msg/provider: patch
---

Fill IWINV AlimTalk template variables by name. IWINV's `templateParam` is positional, and `IWINVProvider` built it from the order of the `variables` object's keys, so `{ code, name }` for a template that reads `#{name} ... #{code}` swapped the two values. The provider now reads the template body (from `providerOptions.templateContent`, or IWINV's template list API through the send's request context, kept for 10 minutes per provider instance) and sends one value per `#{placeholder}` occurrence in template order. A placeholder missing from `variables` fails the send with `INVALID_REQUEST` before anything is sent; `providerOptions.templateParam` is still sent as-is.
