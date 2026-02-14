# Draft: Further Improvements Plan

## Initial Request
User wants to explore next improvements after the Reliability Plan completion.

## Analysis Strategy
I am scanning the recent work and codebase to scope:
1. **Redis Support**: Feasibility of adding `RedisJobQueue`.
2. **DLQ**: How to implement Dead Letter Queue with current schema.
3. **Dashboard**: CLI-based queue inspection (`k-msg queue ls`, `k-msg queue retry`).

## User Preferences
User selected:
- **Dead Letter Queue (DLQ)**
- **Queue Dashboard/CLI**
- **Live Provider Tests**

## Analysis in Progress
Launching scan via `quick` agent to scope:
1. **DLQ**: Identify schema changes needed in `SQLiteJobQueue` (e.g., `failed_jobs` table vs state column).
2. **Dashboard**: Check CLI structure for adding `k-msg queue` command.
3. **Live Tests**: Check provider credential handling for safe integration tests.

## Preliminary Gap Analysis
- `JobQueue` interface likely needs: `listFailed()`, `retry(id)`, `purgeFailed()`.
- CLI needs: `queue list`, `queue retry <id>`, `queue purge`.
- Live Tests need: Secure env var injection in CI/local (e.g., `.env.test.local`).
