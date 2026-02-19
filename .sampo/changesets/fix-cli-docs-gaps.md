---
npm/@k-msg/cli: patch
---

- Fix provider balance CLI exit code semantics: return exit code 3 only for provider errors and 4 when capability is unsupported.
- Update CLI/README docs to use the correct `providers list --config ...` usage and clarify capability-not-supported exit code.
- Add GitHub repository button to docs home pages (KO/EN).
