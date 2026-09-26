---
npm/@k-msg/messaging: patch
---

Find tracking records by `to` and `from` under tenant keys and after a key rotation. Writes hashed these fields with the key `keyResolver.resolveEncryptKey` returned, but lookups hashed with the provider's default key, so a filter found nothing once the two differed. A lookup now hashes each value under that key and under every key from `resolveDecryptKeys`, and matches any of them. Degraded (fail-open) writes and metadata hashes use the resolved key too, and a degraded write that cannot compute a hash stores none instead of failing.

A lookup that cannot compute a hash reports `crypto_fail_count` with `operation: "hash"`. With `failMode: "open"`, a secure-mode lookup left with no hash matches no records; it used to drop the filter and match every record. With `failMode: "closed"`, every kid `resolveDecryptKeys` lists needs a hash key, or lookups fail.
