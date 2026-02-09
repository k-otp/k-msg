### Interpolator Implementation
- Implemented interpolate function in packages/template.
- Used #{key} syntax as required.
- Followed the rule to leave unknown variables as-is.
- Verified with Bun test runner.

### SQLite WAL Mode and Test Cleanup
When using SQLite WAL mode in Bun (`bun:sqlite`), if the database file is unlinked (`fs.unlink`) between tests, the sidecar files (`-wal` and `-shm`) must also be explicitly deleted. Failure to do so can result in "no such table" errors when the next test tries to recreate the database, as SQLite might find orphaned sidecar files.
