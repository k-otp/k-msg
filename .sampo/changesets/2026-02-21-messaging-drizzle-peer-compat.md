---
npm/@k-msg/messaging: patch
---

Relax `drizzle-orm` peer support for `@k-msg/messaging` to include both `^0.44.0` and `^0.45.0`, while keeping the package's development baseline on `0.45.1`.

Also add CI compatibility matrix coverage for Drizzle adapter flows against:

- `drizzle-orm@0.44.7` (minimum verification target)
- `drizzle-orm@0.45.1` (maximum verification target)
