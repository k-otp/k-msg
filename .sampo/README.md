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

## Release PR Policy (`AUTO_RELEASE_PR`)

Automatic release PR creation is gated by a repository variable:

- `AUTO_RELEASE_PR=false` (default): do **not** open `sampo/release` PR automatically
- `AUTO_RELEASE_PR=true`: allow release PR creation when pending changesets exist

The release workflow condition is:

- `vars.AUTO_RELEASE_PR == 'true'`
- `has_changesets == true`
- `should_publish != true`

`should_publish` is computed by `scripts/publish-oidc.sh --check` based on npm registry state.

## Recommended Batch Release Flow (multiple feature PRs)

1. Keep `AUTO_RELEASE_PR=false` while merging normal feature PRs (each PR can still include changesets).
2. Before merging the final PR in the batch, set `AUTO_RELEASE_PR=true`.
3. Merge the final PR into `main` to trigger release PR creation.
4. After the release PR is created, set `AUTO_RELEASE_PR=false` again.

### Commands

```bash
# Enable only for release timing
gh variable set AUTO_RELEASE_PR -b "true" -R k-otp/k-msg

# Disable again after release PR is opened
gh variable set AUTO_RELEASE_PR -b "false" -R k-otp/k-msg
```
