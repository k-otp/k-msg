---
npm/@k-msg/cli: patch
---

Avoid double-wrapping SOLAPI dependency load errors in the CLI provider registry.
The CLI now preserves already-guided dependency errors and keeps the install guidance message single and clear.
