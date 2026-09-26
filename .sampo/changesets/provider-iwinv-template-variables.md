---
npm/@k-msg/provider: patch
---

Fill IWINV AlimTalk template variables by name. IWINV's `templateParam` is positional, and `IWINVProvider` built it from the order of the `variables` object's keys, so `{ code, name }` for a template that reads `#{name} ... #{code}` swapped the two values. The provider now reads the template text (from `providerOptions.templateContent`, or IWINV's template list API through the send's request context, kept for 10 minutes per provider instance) and sends one value per distinct `#{name}`, in the order the names first appear in the content and then in its button links: the same array the key-order mapping sent when the keys were in template order. A placeholder without a value (no key, or `undefined`) fails the send with `INVALID_REQUEST` before anything is sent; with empty `variables` and no `templateContent`, no lookup is made and IWINV refuses a template that needs values. `providerOptions.templateParam` is still sent as-is.
