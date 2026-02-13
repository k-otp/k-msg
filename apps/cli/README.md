# K-Message CLI (`apps/cli`)

Unified CLI for sending Korean messaging traffic (SMS/LMS/MMS, AlimTalk, FriendTalk) through pluggable providers.

## Run

```bash
bun --cwd apps/cli src/cli.ts --help
bun --cwd apps/cli src/cli.ts info
```

## Provider Loading (Plugin Manifest)

This CLI runs in **plugin-manifest mode** by default. It loads providers from:

- `K_MSG_PROVIDER_PLUGINS` (inline JSON), or
- `K_MSG_PROVIDER_PLUGIN_FILE` (JSON file path), or
- `k-msg.providers.json` in the current working directory, or
- `apps/cli/k-msg.providers.json` (repo default).

If you only want to run locally without providers, set:

```bash
export K_MSG_MOCK=true
```

### Default Manifest

This repo includes a safe default manifest at `apps/cli/k-msg.providers.json` (no secrets). It loads providers using env vars.

## Environment Variables

Put your secrets in `apps/cli/.env` (Bun loads it automatically when running from `apps/cli`).

### IWINV (SMS v2 + AlimTalk)

- `IWINV_API_KEY`: AlimTalk API key
- `IWINV_SMS_API_KEY`: SMS v2 API key
- `IWINV_SMS_AUTH_KEY`: SMS v2 auth key
- `IWINV_SENDER_NUMBER`: sender phone number

Optional (IP restriction alert/retry):

- `IWINV_IP_RETRY_COUNT`
- `IWINV_IP_RETRY_DELAY_MS`
- `IWINV_IP_ALERT_WEBHOOK_URL`

### ALIGO (optional)

- `ALIGO_API_KEY`
- `ALIGO_USER_ID`
- `ALIGO_SENDER_KEY`
- `ALIGO_SENDER`

## Commands

### Send (single)

```bash
bun --cwd apps/cli src/cli.ts send -c SMS -p 01012345678 --text "hello" --sender 01000000000
```

Notes:

- `ALIMTALK` requires `--template`.
- `SMS/LMS/MMS/FRIENDTALK` require `--text` (or `--variables '{"message":"..."}'`).

### Bulk Send (multi)

```bash
bun --cwd apps/cli src/cli.ts bulk-send -c SMS --phones 01011112222,01033334444 --text "hello" --sender 01000000000
```

From a file:

```bash
bun --cwd apps/cli src/cli.ts bulk-send -c SMS --phones-file ./phones.txt --text "hello" --sender 01000000000
```

### Round-Robin Rotation (bulk)

The default manifest sets the default provider to `sms-rr`, a router that round-robins across `iwinv` and `aligo` (when both are enabled). If only one upstream provider is enabled, it behaves like that provider.

Override explicitly:

```bash
bun --cwd apps/cli src/cli.ts bulk-send -c SMS --provider iwinv --phones 01011112222,01033334444 --text "hello"
```
