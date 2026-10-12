---
npm/@k-msg/messaging: major
npm/@k-msg/webhook: major
---

Persist recipient delivery progress before sending and after receiving a result. Successful recipients are never retried; only explicit rate-limit admission failures retry automatically. Unknown outcomes require reconciliation. Custom message queues must implement fenced, durable `checkpoint(jobId, data, attempt)`. Completion observer failures no longer cause resends.

Webhook response diagnostics are limited to 4096 bytes by default (`maxResponseBodyBytes`, zero disables retention). The default HTTP client now requires an administrator-maintained `allowedHosts` list for all destinations; only add hosts you control or trust. For arbitrary customer URLs, inject a DNS-pinned or egress-filtered HTTP client. This policy is not a DNS resolver or an exactly-once delivery guarantee.

Lost checkpoint ownership raises `JobCheckpointLostError` and never fails the new owner’s attempt. KV message queues are unsupported; object-backed message queues require a single coordinated writer with strongly consistent reads. Bulk jobs continue later entries after a permanent failure.
