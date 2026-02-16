# k-msg CLI (`apps/cli`)

This CLI is built with [Bunli](https://bunli.dev/) and uses the unified `k-msg` package (KMsg + Providers).

## Install (recommended)

### npm

```bash
npm install -g @k-msg/cli
# or: pnpm add -g @k-msg/cli

k-msg --help
```

Note: the npm package downloads a native binary from GitHub Releases on first run
(`bunli build:all` artifacts: `k-msg-cli-<version>-<target>.tar.gz`), verifies it
using `checksums.txt`, then extracts and caches it under your OS cache directory
(`K_MSG_CLI_CACHE_DIR` to override).

Env overrides:

- `K_MSG_CLI_BASE_URL`: override GitHub release base URL (default: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)
- `K_MSG_CLI_CACHE_DIR`: override where the extracted binary is cached
- `K_MSG_CLI_LOCAL_BINARY`: copy a local binary instead of downloading (useful for local testing)

### curl installer (GitHub Pages)

```bash
curl -fsSL https://k-otp.github.io/k-msg/cli/install.sh | bash
```

Installer environment variables:

- `K_MSG_CLI_VERSION`: override target version (default: latest Pages script version)
- `K_MSG_CLI_INSTALL_DIR`: target directory (default: `~/.local/bin`)
- `K_MSG_CLI_BASE_URL`: override release base URL (default: `https://github.com/k-otp/k-msg/releases/download/cli-v<version>`)

### GitHub Releases (manual)

The distribution workflow also publishes prebuilt binaries to GitHub Releases as:

- `k-msg-cli-<version>-darwin-arm64.tar.gz`
- `k-msg-cli-<version>-darwin-x64.tar.gz`
- `k-msg-cli-<version>-linux-arm64.tar.gz`
- `k-msg-cli-<version>-linux-x64.tar.gz`
- `k-msg-cli-<version>-windows-x64.tar.gz`

After extracting, you'll find the binary at `<target>/k-msg` (or `<target>/k-msg.exe`).

### macOS/Linux

```bash
tar -xzf k-msg-cli-<version>-<target>.tar.gz
sudo install -m 0755 <target>/k-msg /usr/local/bin/k-msg

# optional alias
sudo ln -sf /usr/local/bin/k-msg /usr/local/bin/kmsg

k-msg --help
```

### Windows

Extract the archive and put `k-msg.exe` somewhere on your `PATH`.
Optionally copy it as `kmsg.exe` as an alias.

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

Default config path: `./k-msg.config.json`

Override:

```bash
k-msg --config /path/to/k-msg.config.json providers list
```

Example file: `apps/cli/k-msg.config.example.json`

### `env:` substitution

Any string value like `"env:NAME"` is replaced with the `NAME` environment variable at runtime.
If the env var is missing/empty, commands that need runtime providers will fail with exit code `2`.

## Commands

- `k-msg config init|show|validate`
- `k-msg providers list|health|doctor`
- `k-msg sms send`
- `k-msg alimtalk preflight|send`
- `k-msg send --input <json> | --file <path> | --stdin`
- `k-msg kakao channel categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

## Recommended AlimTalk flow

1. Run provider-level diagnostics.
2. Run AlimTalk preflight for the selected provider/channel/template.
3. Run send after preflight passes.

```bash
k-msg providers doctor
k-msg alimtalk preflight --provider iwinv --template-code TPL_001 --channel main
k-msg alimtalk send --provider iwinv --template-code TPL_001 --to 01012345678 --vars '{"name":"Jane"}'
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
  --template-code TPL_001 \
  --vars '{"name":"Jane"}' \
  --channel main \
  --plus-id @my_channel
```

Failover options:

```bash
k-msg alimtalk send \
  --to 01012345678 \
  --template-code TPL_001 \
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
  --template-code TPL_001 \
  --channel main \
  --sender-key your_sender_key \
  --plus-id @my_channel
```

`preflight` runs onboarding checks (manual/config/capability/api probes) and template lookup before send.

### Advanced JSON send

```bash
k-msg send --input '{"to":"01012345678","text":"hello"}'
```

## Kakao Channel (Aligo capability)

```bash
k-msg kakao channel categories
k-msg kakao channel list
k-msg kakao channel auth --plus-id @my_channel --phone 01012345678
k-msg kakao channel add \
  --plus-id @my_channel \
  --auth-num 123456 \
  --phone 01012345678 \
  --category-code 001001001 \
  --save main
```

## Kakao Template (IWINV/Aligo)

Channel scope (Aligo): use `--channel <alias>` or `--sender-key <value>`.

```bash
k-msg kakao template list
k-msg kakao template get --template-code TPL_001
k-msg kakao template create --name "Welcome" --content "Hello #{name}" --channel main
k-msg kakao template update --template-code TPL_001 --name "Updated"
k-msg kakao template delete --template-code TPL_001

# inspection request is provider-dependent (supported by Aligo)
k-msg kakao template request --template-code TPL_001 --channel main
```

## Output / Exit Codes

- `--json`: print machine-readable JSON
- AI environments (Bunli `@bunli/plugin-ai-detect`): JSON output is auto-enabled
  when an agent is detected (`CLAUDECODE`, `CURSOR_AGENT`, `CODEX_CI` /
  `CODEX_SHELL` / `CODEX_THREAD_ID`, `MCP_SERVER_NAME` / `MCP_SESSION_ID` /
  `MCP_TOOL_NAME`)
- exit code:
  - `0`: success
  - `2`: input/config error
  - `3`: provider/network error
  - `4`: capability not supported

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
