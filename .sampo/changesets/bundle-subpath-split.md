---
npm/@k-msg/provider: patch
npm/@k-msg/messaging: patch
npm/@k-msg/template: patch
---

Improve bundle split points for send-focused consumers without breaking existing imports.

- Add provider subpaths for send/template separation:
  - `@k-msg/provider/iwinv/send`
  - `@k-msg/provider/iwinv/template`
  - `@k-msg/provider/aligo/send`
  - `@k-msg/provider/aligo/template`
- Refactor `@k-msg/messaging/sender` to avoid static `zod` imports on the sender entry path.
- Add `@k-msg/template/send` and `@k-msg/template/lifecycle` subpaths and mark template package as side-effect free.
- Strengthen CI bundle checks with raw+gzip limits and forbidden-import guards for send-only artifacts.
