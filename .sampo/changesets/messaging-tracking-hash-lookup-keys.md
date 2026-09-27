---
npm/@k-msg/messaging: patch
---

Find tracking records by `to` and `from` under tenant keys and after a key rotation. Writes hashed these fields with the key `keyResolver.resolveEncryptKey` returned, but lookups hashed with the provider's default key, so a filter found nothing once the two differed. A lookup now hashes each value under that key, every key from `resolveDecryptKeys`, and the provider's default key, and matches any of them, so records written before a resolver was configured stay findable too. Degraded (fail-open) writes and metadata hashes use the resolved key as well. A degraded write falls back to the provider's default key when the resolver fails, and to an empty recipient hash, which no lookup matches, when it cannot hash at all; it no longer throws.

A lookup that cannot resolve a key or compute a hash reports `crypto_fail_count` with `operation: "hash"`. With `failMode: "open"`, it keeps the keys that did resolve, and a secure-mode lookup left with no hash matches no records; it used to drop the filter and match every record. With `failMode: "closed"`, every kid `resolveDecryptKeys` lists needs a hash key, or lookups fail.
