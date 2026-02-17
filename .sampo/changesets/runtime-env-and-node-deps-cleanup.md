---
npm/@k-msg/core: patch
npm/@k-msg/provider: patch
npm/@k-msg/messaging: patch
npm/@k-msg/analytics: patch
npm/k-msg: patch
---

Remove remaining Node runtime dependencies from analytics/messaging/runtime paths and standardize runtime-neutral environment variable access.

- Replaced Node `events` usage with package-local runtime-neutral `EventEmitter` implementations.
- Replaced `NodeJS.Timeout` annotations with `ReturnType<typeof setTimeout/setInterval>`.
- Replaced direct `process.env` reads in core/provider defaults with global-compatible env resolution:
  `globalThis.__K_MSG_ENV__` -> `globalThis.__ENV__` -> `globalThis.process?.env`.
- Removed `@types/node` from package-level devDependencies where no longer needed.
