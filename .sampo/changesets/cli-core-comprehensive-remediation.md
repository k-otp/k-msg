---
npm/@k-msg/cli: patch
---

Harden CLI/core reliability by making option parsing deterministic (`--flag`/`--no-flag` with strict boolean validation), aligning provider error payloads to `details`, and migrating the send contract field to `templateId` (without compatibility aliases) with matching docs/tests and canonical CI parity checks.
