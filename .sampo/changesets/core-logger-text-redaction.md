---
npm/@k-msg/core: patch
---

Redact log messages and error text, not only context keys. `Logger` wrote `message`, `error.message`, and `error.stack` verbatim, so a phone number or credential interpolated into them reached console output. Those texts and free-text context values now pass through the new `redactLogText`, which masks Korean phone numbers (domestic, VoIP, toll-free, representative, parenthesized, or `+82`) and redacts credentials written as key/value pairs such as `apiKey=...`, `AWS_SECRET_ACCESS_KEY=...`, `client_secret: ...`, `"secret":"..."`, or `Authorization: Bearer ...`, and passwords in URLs such as `postgres://user:...@host`. Context keys such as `api_key`, `x-api-key`, and `private_key` are now masked as well.
