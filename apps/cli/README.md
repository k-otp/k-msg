# k-msg CLI (`apps/cli`)

This CLI is built with Bunli and uses the unified `k-msg` package (KMsg + Providers).

## Run

```bash
bun --cwd apps/cli run build
bun --cwd apps/cli dist/cli.js --help

# or run TS directly (dev)
bun --cwd apps/cli src/cli.ts --help
```

## Config (`k-msg.config.json`)

Default config path: `./k-msg.config.json`

Override:

```bash
bun --cwd apps/cli src/cli.ts --config /path/to/k-msg.config.json providers list
```

Example file: `apps/cli/k-msg.config.example.json`

### `env:` substitution

Any string value like `"env:NAME"` is replaced with `process.env.NAME` at runtime.
If the env var is missing/empty, commands that need runtime providers will fail with exit code `2`.

## Commands

- `k-msg config init|show|validate`
- `k-msg providers list|health`
- `k-msg sms send`
- `k-msg alimtalk send`
- `k-msg send --input <json> | --file <path> | --stdin`
- `k-msg kakao channel categories|list|auth|add`
- `k-msg kakao template list|get|create|update|delete|request`

## Send

### SMS

```bash
bun --cwd apps/cli src/cli.ts sms send --to 01012345678 --text "hello"
```

### AlimTalk

Terminology: the CLI uses **Kakao Channel** and **senderKey** (never “profile”).

```bash
bun --cwd apps/cli src/cli.ts alimtalk send \
  --to 01012345678 \
  --template-code TPL_001 \
  --vars '{"name":"Jane"}' \
  --channel main
```

### Advanced JSON send

```bash
bun --cwd apps/cli src/cli.ts send --input '{"to":"01012345678","text":"hello"}'
```

## Kakao Channel (Aligo capability)

```bash
bun --cwd apps/cli src/cli.ts kakao channel categories
bun --cwd apps/cli src/cli.ts kakao channel list
bun --cwd apps/cli src/cli.ts kakao channel auth --plus-id @my_channel --phone 01012345678
bun --cwd apps/cli src/cli.ts kakao channel add \
  --plus-id @my_channel \
  --auth-num 123456 \
  --phone 01012345678 \
  --category-code 001001001 \
  --save main
```

## Kakao Template (IWINV/Aligo)

Channel scope (Aligo): use `--channel <alias>` or `--sender-key <value>`.

```bash
bun --cwd apps/cli src/cli.ts kakao template list
bun --cwd apps/cli src/cli.ts kakao template get --template-code TPL_001
bun --cwd apps/cli src/cli.ts kakao template create --name "Welcome" --content "Hello #{name}" --channel main
bun --cwd apps/cli src/cli.ts kakao template update --template-code TPL_001 --name "Updated"
bun --cwd apps/cli src/cli.ts kakao template delete --template-code TPL_001

# inspection request is provider-dependent (supported by Aligo)
bun --cwd apps/cli src/cli.ts kakao template request --template-code TPL_001 --channel main
```

## Output / Exit Codes

- `--json`: print machine-readable JSON
- exit code:
  - `0`: success
  - `2`: input/config error
  - `3`: provider/network error
  - `4`: capability not supported
