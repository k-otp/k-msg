---
npm/k-msg: patch
npm/@k-msg/core: patch
npm/@k-msg/provider: patch
npm/@k-msg/template: patch
npm/@k-msg/messaging: patch
npm/@k-msg/analytics: patch
npm/@k-msg/channel: patch
npm/@k-msg/webhook: patch
---

Fix `require()` in Node. The CommonJS build shipped as `.js` files in `"type": "module"` packages, so Node loaded it as ESM and `require()` threw `ReferenceError: module is not defined in ES module scope`. The CommonJS build now ships as `.cjs`, and `main` and every `require` export condition point at it. `require()` and `import()` expose the same export names; `import` still resolves to the `.mjs` build.
