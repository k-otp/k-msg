---
npm/@k-msg/messaging: patch
---

Encrypt tracking metadata with the key that `keyResolver.resolveEncryptKey` returns, as `to` and `from` already were. Metadata was encrypted with the provider's active key, so a tenant-specific or newly rotated key covered only part of a record.
