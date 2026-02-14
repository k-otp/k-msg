# Further Improvements Plan: DLQ, CLI Queue & Live Tests

## 1. Context & Goals
The messaging system requires better handling of persistent failures and improved developer tools for monitoring.
- **DLQ (Dead Letter Queue)**: Isolate jobs that have exhausted retries to prevent them from clogging the main queue and to allow manual intervention.
- **CLI Queue Management**: Provide a user-friendly interface to inspect queue status, list failures, and trigger retries without manual SQL.
- **Live Provider Tests**: Implement automated verification against the real IWINV API (guarded by environment variables) to ensure production readiness.

## 2. Strategy
- **DLQ Infrastructure**: Add a `failed_jobs` table to the SQLite schema. Update the `JobQueue` interface to include methods for DLQ management (`moveToDLQ`, `listFailed`, `retry`, `getStats`).
- **CLI Commands**: Implement a new `queue` command group in `apps/cli` using `commander`. This will provide subcommands like `stats`, `list`, `retry`, `inspect`, and `clear`.
- **Live Testing**: Create `provider.live.test.ts` in `@k-msg/provider`. Use `RUN_LIVE_TESTS=true` as a guard to ensure these tests only run when explicitly requested and credentials are provided.

## 3. Execution Phases
- **Phase 1: DLQ Infrastructure**: Interface updates and SQLite implementation.
- **Phase 2: CLI Queue Management**: CLI command implementation and integration.
- **Phase 3: Live Provider Tests**: Live test suite for IWINV provider.

## 4. Tasks (Atomic Breakdown)

### 4.1. JobQueue Interface Enhancement
- [ ] Add `JobStatus.DLQ` (or just use `FAILED` but move to separate storage).
- [ ] Add `listFailed(): Promise<Job<T>[]>` to `JobQueue` interface.
- [ ] Add `retry(jobId: string): Promise<boolean>` to `JobQueue` interface.
- [ ] Add `getStats(): Promise<QueueStats>` to `JobQueue` interface.
- [ ] Add `moveToDLQ(jobId: string): Promise<void>` to `JobQueue` interface.

### 4.2. SQLite Schema & DLQ Logic
- [ ] Modify `initializeSchema` in `SQLiteJobQueue` to create `failed_jobs` table.
- [ ] Implement `moveToDLQ` by moving row from `jobs` to `failed_jobs`.
- [ ] Implement `listFailed` to query `failed_jobs` table.
- [ ] Implement `retry` to move row back to `jobs` table with `PENDING` status and reset attempts.

### 4.3. Job Processor Integration
- [ ] Update `JobProcessor` (or `fail` logic) to automatically call `moveToDLQ` when `attempts >= maxAttempts`.
- [ ] Add logging for DLQ movements.

### 4.4. CLI Queue Command Structure
- [ ] Create `apps/cli/src/commands/queue.ts`.
- [ ] Define `queue` command group and subcommands: `stats`, `list`, `retry`, `inspect`, `clear`.
- [ ] Register `queue` command in `apps/cli/src/cli.ts`.

### 4.5. CLI Queue Command Implementation
- [ ] `stats`: Display table of job counts by status (using `getStats`).
- [ ] `list`: Show table of failed jobs in DLQ.
- [ ] `inspect <id>`: Show full JSON data and error message for a specific job.

### 4.6. CLI Queue Actions
- [ ] `retry <id>`: Trigger the `retry` method and report success/failure.
- [ ] `clear`: Interactive confirmation to clear all jobs or just completed/failed jobs.

### 4.7. Live Provider Tests (IWINV)
- [ ] Create `packages/provider/src/iwinv/provider.live.test.ts`.
- [ ] Implement `getBalance` test using real API key.
- [ ] Implement `listTemplates` test using real API key.
- [ ] (Optional) Implement `sendMessage` test if `IWINV_TEST_PHONE` is provided.
- [ ] Ensure all tests are skipped if `RUN_LIVE_TESTS !== 'true'`.

## 5. Verification Plan

### Phase 1: DLQ Infrastructure
- [ ] `bun test packages/messaging/src/queue/sqlite-job-queue.test.ts`
- [ ] Verify `failed_jobs` table exists in local SQLite file.
- [ ] Manually verify job movement using a script.

### Phase 2: CLI Queue Management
- [ ] `bun run apps/cli/src/cli.ts queue stats`
- [ ] `bun run apps/cli/src/cli.ts queue list`
- [ ] `bun run apps/cli/src/cli.ts queue retry job_123`
- [ ] Verify `table` output is formatted correctly.

### Phase 3: Live Provider Tests
- [ ] `RUN_LIVE_TESTS=true IWINV_API_KEY=your_key bun test packages/provider/src/iwinv/provider.live.test.ts`
- [ ] Verify balance and template list match account status.
