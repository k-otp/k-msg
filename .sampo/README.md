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

## Release PR policy

The release workflow keeps a single `sampo/release` PR up to date whenever both of these are true:

- `has_changesets == true`
- `should_publish != true`

`should_publish` is computed by `scripts/publish-oidc.sh --check` based on npm registry state.

This means normal feature PRs can carry changesets continuously, and the release PR is updated automatically after merges to `main`.

## Optional GitHub App

If you want PR-time reminders for missing changesets, install the Sampo GitHub App:

- <https://github.com/apps/sampo-s-bot>

The app only reminds contributors to add a changeset when a PR needs one.
It does not create or manage the `sampo/release` PR; that remains the job of the release workflow.
