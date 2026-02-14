# Sampo

This repository uses **Sampo** for changesets and automated releases.

## Quick start

- Add a changeset (for changes under `packages/*`):

  ```bash
  sampo add
  ```

- Locally preview what would be released:

  ```bash
  sampo release --dry-run
  ```

Changesets are stored in `.sampo/changesets/*.md`.

