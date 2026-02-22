# k-msg CLI (`apps/cli`)

This CLI is built with [Bunli](https://bunli.dev/) and uses the unified `k-msg` package (KMsg + Providers).

## Install (curl only)

```bash
curl -fsSL https://k-otp.github.io/k-msg/cli/install.sh | bash
k-msg --help
```

Installer environment variables:

- `K_MSG_CLI_VERSION`: override target version (default: latest Pages script version)
- `K_MSG_CLI_INSTALL_DIR`: target directory override (default: auto-detect active `k-msg` directory when writable, otherwise `~/.local/bin`)
- `K_MSG_CLI_BASE_URL`: override release base URL (default: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)

The project now standardizes user-facing CLI installation on the curl installer path.
Other install paths are intentionally undocumented here.

## Run (local/dev)

```bash
# Generate command types
bun run --cwd apps/cli generate

# Build native binary
bun run --cwd apps/cli build
./apps/cli/dist/k-msg --help

# Build Bun-runtime JS bundle (optional)
bun run --cwd apps/cli build:js
bun --cwd apps/cli dist/k-msg.js --help

# Or run TS directly (dev)
bun --cwd apps/cli src/k-msg.ts --help
```

## Config (`k-msg.config.json`)

Default config path:

- macOS/Linux: `${XDG_CONFIG_HOME:-~/.config}/k-msg/k-msg.config.json`
- Windows: `%APPDATA%\\k-msg\\k-msg.config.json`
- Fallback: `./k-msg.config.json` (used when home path file does not exist)

Override:

```bash
k-msg providers list --config /path/to/k-msg.config.json
```

Note: `--config` is a subcommand option in the current CLI (for example: `providers`, `sms`, `alimtalk`).

Example file: `apps/cli/k-msg.config.example.json`

Schema URLs:

- Latest: `https://raw.githubusercontent.com/k-otp/k-msg/main/apps/cli/schemas/k-msg.config.schema.json`
- Versioned (`v1`): `https://raw.githubusercontent.com/k-otp/k-msg/main/apps/cli/schemas/k-msg.config.v1.schema.json`

Initialize config:

```bash
# default: interactive wizard (TTY)
k-msg config init

# force full template (also auto-used in non-interactive environments)
k-msg config init --template full

# add providers incrementally
k-msg config provider add
k-msg config provider add iwinv
```

### `env:` substitution

Any string value like `"env:NAME"` is replaced with the `NAME` environment variable at runtime.
If the env var is missing/empty, commands that need runtime providers will fail with exit code `2`.

### Provider send value guide

When you are unsure which values must be prepared before send, use this checklist:

1. Configure provider credentials with `env:` references.
2. Run `k-msg providers doctor` to verify account/config readiness.
3. For AlimTalk, run `k-msg alimtalk preflight` with the provider/template/channel you will use.
4. Send only after preflight passes.

Credential examples:

```bash
# Aligo
export ALIGO_API_KEY="..."
export ALIGO_USER_ID="..."
export ALIGO_SENDER_KEY="..."   # Kakao senderKey
export ALIGO_SENDER="029302266" # SMS/LMS sender

# IWINV
export IWINV_API_KEY="..."          # AlimTalk key
export IWINV_SMS_API_KEY="..."      # SMS/LMS/MMS key
export IWINV_SMS_AUTH_KEY="..."     # SMS/LMS/MMS secret
export IWINV_SMS_COMPANY_ID="..."   # status/balance context
export IWINV_SENDER_NUMBER="029302266"

# SOLAPI
export SOLAPI_API_KEY="..."
export SOLAPI_API_SECRET="..."
export SOLAPI_DEFAULT_FROM="029302266"
export SOLAPI_KAKAO_PF_ID="..."     # Kakao profileId(pfId)
```

Required values by provider/channel:

| Provider | Channel | Required config keys | Required send-time values | Notes |
| --- | --- | --- | --- | --- |
| `aligo` | `SMS/LMS/MMS` | `apiKey`, `userId` | `to`, `text`, sender (`--from` or `aligo.config.sender`) | MMS also needs image input |
| `aligo` | `ALIMTALK` | `apiKey`, `userId` | `to`, `template-id`, `vars`, senderKey (`--sender-key`/`--channel` alias/`aligo.config.senderKey`), sender (`--from` or `aligo.config.sender`) | `preflight` validates channel/template access |
| `iwinv` | `SMS/LMS/MMS` | `apiKey`, `smsApiKey`, `smsAuthKey` | `to`, `text`, sender (`--from` or `iwinv.config.smsSenderNumber`/`senderNumber`) | MMS requires image binary input |
| `iwinv` | `ALIMTALK` | `apiKey` | `to`, `template-id`, `vars` | If failover/reSend is enabled, sender callback is required (`--from` or sender number in config) |
| `solapi` | `SMS/LMS/MMS` | `apiKey`, `apiSecret` | `to`, `text`, sender (`--from` or `solapi.config.defaultFrom`) | MMS also needs image input |
| `solapi` | `ALIMTALK` | `apiKey`, `apiSecret` | `to`, `template-id`, `vars`, profileId/pfId (`--sender-key`/channel alias or `solapi.config.kakaoPfId`) | For preflight policy checks, set `plusId` via `--plus-id` or channel/default alias |
| `mock` | all | none | minimal message fields (`to`, `text` or `template-id`/`vars`) | Local test provider |

## Commands

- `k-msg config init|show|validate`
- `k-msg config provider add [type]`
- `k-msg providers list|health|doctor`
- `k-msg sms send`
- `k-msg alimtalk preflight|send`
- `k-msg send --input <json> | --file <path> | --stdin` (advanced/raw JSON only)
- `k-msg db schema print|generate`
- `k-msg db tracking migrate plan|apply|status|retry`
- `k-msg kakao channel binding list|resolve|set|delete`
- `k-msg kakao channel api categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

Template command internals:

- `kakao template *` commands route through `TemplateLifecycleService` from `@k-msg/template`.
- `create/update` validate `name/content/buttons` using `validateTemplatePayload` + `parseTemplateButtons` before provider API calls.

## DB schema generator

Generate canonical SQL DDL and/or Drizzle schema source from the same
`@k-msg/messaging/adapters/cloudflare` schema utilities.

```bash
# Print both drizzle+sql to stdout
k-msg db schema print --dialect postgres

# Print only SQL for queue schema
k-msg db schema print --dialect postgres --target queue --format sql

# Generate both files in cwd
k-msg db schema generate --dialect postgres

# Generate SQL only to a custom path
k-msg db schema generate \
  --dialect mysql \
  --target tracking \
  --format sql \
  --out-dir ./db \
  --sql-file tracking.sql
```

Flags:

- `--dialect <postgres|mysql|sqlite>`: required
- `--target <tracking|queue|both>`: default `both`
- `--format <drizzle|sql|both>`: default `both`
- `generate` only:
  - `--out-dir <path>` default current directory
  - `--drizzle-file <name>` default `kmsg.schema.ts`
  - `--sql-file <name>` default `kmsg.schema.sql`
  - `--force` default `false` (without it, generation fails if file exists)

## Tracking migration orchestrator

Field crypto migration commands are designed for resumable legacy->secure transitions.

```bash
k-msg db tracking migrate plan --sqlite-file ./local.db
k-msg db tracking migrate apply --sqlite-file ./local.db
k-msg db tracking migrate status --sqlite-file ./local.db
k-msg db tracking migrate retry --sqlite-file ./local.db
```

Operational notes:

- state is persisted in DB meta tables plus local snapshots under `.kmsg/migrations`
- `retry` only replays failed chunks
- use `status` before changing rollout flags (`compatPlainColumns`)

## Recommended AlimTalk flow

1. Run provider-level diagnostics.
2. Run AlimTalk preflight for the selected provider/channel/template.
3. Run send after preflight passes.

```bash
k-msg providers doctor
k-msg alimtalk preflight --provider iwinv --template-id TPL_001 --channel main
k-msg alimtalk send --provider iwinv --template-id TPL_001 --to 01012345678 --vars '{"name":"Jane"}'
```

Notes:

- For IWINV, Kakao channel onboarding is manual in vendor console. Keep the manual ack in config updated.
- For providers with `required_if_no_inference`, preflight fails when `plusId` is missing and inference cannot resolve it.

## Send

### SMS

```bash
k-msg sms send --to 01012345678 --text "hello"
```

### AlimTalk

Terminology: the CLI uses **Kakao Channel** and **senderKey** (never “profile”).

```bash
k-msg alimtalk send \
  --to 01012345678 \
  --template-id TPL_001 \
  --vars '{"name":"Jane"}' \
  --channel main \
  --plus-id @my_channel
```

Failover options:

```bash
k-msg alimtalk send \
  --to 01012345678 \
  --template-id TPL_001 \
  --vars '{"name":"Jane"}' \
  --failover true \
  --fallback-channel sms \
  --fallback-content "Fallback SMS text" \
  --fallback-title "Fallback LMS title"
```

When providers return send warnings (for example failover partial/unsupported), CLI prints `WARNING ...` lines in text mode and includes them in `--json` output.

### Preflight

```bash
k-msg alimtalk preflight \
  --provider iwinv \
  --template-id TPL_001 \
  --channel main \
  --sender-key your_sender_key \
  --plus-id @my_channel
```

`preflight` runs onboarding checks (manual/config/capability/api probes) and template lookup before send.

### Advanced JSON send

`k-msg send` is an advanced command for raw `SendInput` JSON (object or array).
For common workflows, prefer `k-msg sms send` and `k-msg alimtalk send`.

```bash
k-msg send --input '{"to":"01012345678","text":"hello"}'
```

Single preview without sending:

```bash
k-msg send --input '{"to":"01012345678","text":"hello"}' --dry-run
```

Batch preview without sending:

```bash
k-msg send --input '[{"to":"01011112222","text":"hello 1"},{"to":"01033334444","text":"hello 2"}]' --dry-run
```

`providers doctor` and `send --dry-run` have different roles:

- `k-msg providers doctor`: provider/account/capability readiness checks
- `k-msg send --dry-run`: request payload preview/validation (no provider send)

Boolean flag semantics (applies to `--json`, `--verbose`, `--dry-run`, `--stdin`, `--failover`, `--force`):

- `--flag` -> `true`
- `--flag true` -> `true`
- `--flag false` -> `false`
- `--no-flag` -> `false`
- Invalid boolean values (for example `--dry-run maybe`) fail with exit code `2`

Resolution precedence for overlapping values is:

- `CLI flag > environment variable > config file > built-in default`

## Kakao Channel

```bash
# config/provider-hint binding management (works for api/manual/none providers)
k-msg kakao channel binding list
k-msg kakao channel binding resolve --channel main
k-msg kakao channel binding set --alias main --provider aligo-main --sender-key SENDER_KEY --plus-id @my_channel
k-msg kakao channel binding delete --alias old-channel

# provider API operations (api-mode providers only, e.g. aligo/mock)
k-msg kakao channel api categories --provider aligo-main
k-msg kakao channel api list --provider aligo-main
k-msg kakao channel api auth --provider aligo-main --plus-id @my_channel --phone 01012345678
k-msg kakao channel api add \
  --provider aligo-main \
  --plus-id @my_channel \
  --auth-num 123456 \
  --phone 01012345678 \
  --category-code 001001001 \
  --save main
```

Legacy notice: `k-msg kakao channel categories|list|auth|add` were removed. The CLI now prints guidance to the new `binding` / `api` command groups.

## Kakao Template (IWINV/Aligo)

Channel scope (Aligo): use `--channel <alias>` or `--sender-key <value>`.

```bash
k-msg kakao template list
k-msg kakao template get --template-id TPL_001
k-msg kakao template create --name "Welcome" --content "Hello #{name}" --channel main
k-msg kakao template update --template-id TPL_001 --name "Updated"
k-msg kakao template delete --template-id TPL_001

# inspection request is provider-dependent (supported by Aligo)
k-msg kakao template request --template-id TPL_001 --channel main
```

## Output / Exit Codes

- `--json`: print machine-readable JSON
- AI environments (Bunli `@bunli/plugin-ai-detect`): JSON output is auto-enabled
  when an agent is detected (`CLAUDECODE`, `CURSOR_AGENT`, `CODEX_CI` /
  `CODEX_SHELL` / `CODEX_THREAD_ID`, `MCP_SERVER_NAME` / `MCP_SESSION_ID` /
  `MCP_TOOL_NAME`)
- Force text output in AI environments with `--json false` (or `--no-json`)
- exit code:
  - `0`: success
  - `2`: input/config error
  - `3`: provider/network error
  - `4`: unsupported capability (for example, provider does not support `balance`)

## Manual Check Config Example

`k-msg.config.json` can store manual onboarding evidence used by `doctor/preflight`:

```json
{
  "onboarding": {
    "manualChecks": {
      "iwinv": {
        "channel_registered_in_console": {
          "done": true,
          "checkedAt": "2026-02-16T09:00:00+09:00",
          "note": "Approved in IWINV console",
          "evidence": "internal-ticket-1234"
        }
      }
    }
  }
}
```
