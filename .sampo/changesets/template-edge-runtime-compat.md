---
npm/@k-msg/template: patch
---

Remove runtime dependence on Node's event module in `@k-msg/template` so it can run in Edge environments without `nodejs_compat`.
Also drops `@types/node` from the package's dev dependencies and documents Edge runtime compatibility in package README files.
