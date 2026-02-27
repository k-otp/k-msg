---
npm/k-msg: patch
---

improve release readiness with CI smoke checks and docs alignment

- add pre-publish `npm pack --dry-run` smoke checks to catch packaging regressions before publish
- exclude sourcemap artifacts from published npm tarballs by narrowing package `files` globs
- document bundle-size threshold update rules and recommend `k-msg/core` for bundle-sensitive usage
- include refreshed generated API docs snapshot for current core and messaging helper surface
