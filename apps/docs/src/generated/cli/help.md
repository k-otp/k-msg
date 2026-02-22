## CLI Help

Generated from `apps/cli/src/k-msg.ts`.

## k-msg --help

```text
k-msg v0.8.0
k-msg CLI (prebuilt binaries via GitHub Releases)

Commands:
  alimtalk   AlimTalk utilities
  config     Configuration helpers
  db         Database schema utilities
  kakao      Kakao channel/template management
  providers  Provider utilities
  send       Advanced send using raw SendInput JSON object/array
  sms        SMS utilities
```

## k-msg alimtalk --help

```text
Usage: k-msg alimtalk [options]

AlimTalk utilities

Subcommands:
  send       Send AlimTalk
  preflight  Run ALIMTALK onboarding preflight checks
```

## k-msg config --help

```text
Usage: k-msg config [options]

Configuration helpers

Subcommands:
  init      Initialize k-msg config
  show      Show detected configuration
  validate  Validate configuration file
  provider  Provider-level config helpers
```

## k-msg kakao --help

```text
Usage: k-msg kakao [options]

Kakao channel/template management

Subcommands:
  channel   Kakao channel management
  template  Kakao template management
```

## k-msg providers --help

```text
Usage: k-msg providers [options]

Provider utilities

Subcommands:
  list     List configured providers
  health   Run health checks for providers
  balance  Query provider balance for providers that support it
  doctor   Run onboarding checks for configured providers
```

## k-msg send --help

```text
Usage: k-msg send [options]

Advanced send using raw SendInput JSON object/array

Options:
  --config    Path to k-msg config (default:
              $XDG_CONFIG_HOME/k-msg/k-msg.config.json or
              %APPDATA%\k-msg\k-msg.config.json; fallback: ./k-msg.config.json)
  --json      Output JSON (boolean: --json, --json true|false, --no-json;
              default: false)
  --provider  Provider id override
  --dry-run   Validate raw JSON and preview only (no provider send) (boolean:
              --dry-run, --dry-run true|false, --no-dry-run; default: false)
  --input     Raw SendInput JSON object/array string
  --file      Path to raw SendInput JSON object/array file
  --stdin     Read raw SendInput JSON object/array from stdin (boolean:
              --stdin, --stdin true|false, --no-stdin; default: false)
```

## k-msg sms --help

```text
Usage: k-msg sms [options]

SMS utilities

Subcommands:
  send  Send SMS/LMS/MMS
```
