## Mock Provider Implementation
- Created a more sophisticated MockProvider in .
- Implemented  to simulate failures for testing retry logic.
- Maintained backward compatibility by implementing  and re-exporting from the old location.
## Mock Provider Implementation
- Created a more sophisticated MockProvider in packages/provider/src/providers/mock/mock.provider.ts.
- Implemented mockFailure to simulate failures for testing retry logic.
- Maintained backward compatibility by implementing TemplateProvider and re-exporting from the old location.
- Split 'add JobQueue interface and MockProvider' into 3 atomic commits across messaging and provider packages to maintain history clarity.
- Fixed types and removed comments in packages/messaging/src/queue/sqlite-job-queue.test.ts
