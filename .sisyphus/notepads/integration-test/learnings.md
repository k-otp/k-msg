## 2026-02-07 - Template Flow Integration Test
- Updated MockProvider to implement TemplateProvider for in-memory template CRUD.
- Created tests/integration/setup.ts for environment setup.
- Created tests/integration/template-flow.test.ts covering full lifecycle (Create, List, Update, Send with KMsg, Delete).
- Verified with bun test.
