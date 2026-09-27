---
npm/@k-msg/cli: minor
---

`k-msg db schema print` and `generate` take the schema options the SQL stores and queues use: `--message-id-type`, `--id-type`, `--short-text-type`, `--timestamp-type` and `--json-type` (the tracking store's `typeStrategy`), `--tracking-table`, `--queue-table`, and `--store-raw`. Before, they always printed the default schema, which a store with, say, `typeStrategy: { timestamp: "date" }` does not match. `columnMap`, `indexNames` and field-crypto schemas still need the schema builders in code.
