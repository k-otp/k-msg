---
npm/@k-msg/messaging: patch
---

`HyperdriveJobQueue.dequeue()` no longer hands one job to two workers on D1, SQLite or MySQL. It read the next job and marked it `processing` in separate statements, which D1 runs one at a time with nothing holding the row between them, and on MySQL the read took no lock and the write did not check the status. Two workers dequeueing at once could both get the same job; on MariaDB, four workers took the same job up to four times. On SQLite and D1, taking a job is now one `UPDATE ... RETURNING` statement. On MySQL, the queue finds the job with a plain read, then locks it by id and checks that it is still pending, which holds at any isolation level when the client has `transaction()`. Concurrent MySQL dequeues can wait on each other for a row.

Jobs read from `HyperdriveJobQueue` also no longer carry the current time as `completedAt` and `failedAt` when those columns are empty.
