---
npm/@k-msg/provider: patch
---

Send Aligo AlimTalk messages that match their template. Aligo's `message_1` must be the approved template's text with its variables filled in, but without the undocumented `providerOptions.templateContent` the provider sent the variable values joined by newlines (and an empty message for a template without variables), which Kakao rejects as not matching the template. `AligoProvider` now reads the template body from `providerOptions.templateContent`, or else Aligo's template list API through the send's request context, keeping it for 10 minutes per provider instance and sender key, and fills the placeholders by name. A placeholder without a value in `variables` (no key, or `undefined`) fails the send with `INVALID_REQUEST` before anything is sent; a `_full_text` variable is still sent as-is.
