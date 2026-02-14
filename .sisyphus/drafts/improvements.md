# Draft: Improvement Analysis

## Initial Request
User wants to derive improvements for the K-Message platform.

## Analysis Strategy
I am currently scanning the codebase to identify objective improvements in:
1. **Technical Debt**: Explicit TODOs/FIXMEs.
2. **Test Health**: Skipped tests and coverage gaps.
3. **Architecture Quality**: Coupling in Messaging and Provider packages.
4. **Type Safety**: Usage of `any`.
5. **Dependency Management**: Consistency across the monorepo.

## User Preferences
User selected ALL categories:
- Code Quality
- Testing & CI/CD
- Performance
- Features
- Developer Experience

## Final Decisions
- **Concurrency**: **Multi-process supported**.
  - *Action*: Use SQLite WAL mode + Atomic dequeue (UPDATE ... RETURNING).
- **Injection**: **Constructor Injection**.
  - *Action*: `new MessageJobProcessor(provider)`.
- **Mock Scope**: **Full Simulation**.
  - *Action*: Mock must support `failNext()`, `setLatency()`.

## Plan Content (Mental Model)
1. **Interfaces**: `JobQueue<T>` (enqueue, dequeue, complete, fail).
2. **SQLite Impl**: `SQLiteJobQueue` class.
   - `CREATE TABLE IF NOT EXISTS jobs (...)`
   - `PRAGMA journal_mode = WAL;`
   - `dequeue()`: `UPDATE jobs SET status='processing', updated_at=... WHERE id = (SELECT id FROM jobs WHERE status='pending' ORDER BY priority DESC, created_at ASC LIMIT 1) RETURNING *;`
3. **Refactor**:
   - `JobProcessor` takes `JobQueue` in constructor.
   - `MessageJobProcessor` takes `Provider` in constructor.
   - `processSingleMessage` calls `this.provider.send()`.
4. **Mock Provider**:
   - `class MockProvider implements Provider`
   - Store `sentMessages: SendOptions[]`
   - `shouldFail: boolean`, `failureCount: number`.
5. **E2E Tests**:
   - `apps/cli/src/__tests__/e2e.test.ts`
   - Instantiate `MockProvider`.
   - Instantiate `MessageJobProcessor(mockProvider)`.
   - Queue message -> Process -> Assert `mockProvider.sentMessages` has it.

