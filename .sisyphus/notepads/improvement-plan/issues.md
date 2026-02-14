
### SQLiteError: no such table in tests
Encountered `SQLiteError: no such table: main.jobs` during tests for `SQLiteJobQueue`. This was caused by WAL mode sidecar files remaining on disk after the main database file was unlinked. Fixed by updating the test cleanup logic to remove all three database-related files.
