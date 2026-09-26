---
npm/@k-msg/webhook: patch
---

Fix D1 webhook persistence setup. `createD1WebhookPersistence` created its tables with `db.exec()`, which D1 runs one line at a time, so the multi-line `CREATE TABLE` statements failed and every endpoint and delivery store call errored unless `initializeSchema: false` was set. Each schema statement now runs as its own prepared statement.
