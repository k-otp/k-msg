# K-msg CLI

Command-line interface for the K-Message platform. Manage templates, send test messages, and configure your providers directly from the terminal.

## Installation

The CLI is included in the monorepo. To use it globally, you can link it:

```bash
cd apps/cli
bun link
```

Or run it directly using bun:

```bash
bun run apps/cli/src/cli.ts [command]
```

## Configuration

Before using the CLI, you need to configure your provider API keys. You can use environment variables or a configuration file.

### Environment Variables

```bash
export IWINV_API_KEY="your-api-key"
export IWINV_BASE_URL="https://alimtalk.bizservice.iwinv.kr"
export IWINV_SENDER_NUMBER="01000000000"
```

### Configuration Commands

- `k-msg config init`: Interactive setup to create `k-msg.config.json`.
- `k-msg config show`: Display current configuration.
- `k-msg setup`: Interactive provider setup.

## Messaging Commands

### Send Message

Send an AlimTalk message using a template:

```bash
k-msg send --template welcome_tpl --phone 01012345678 --variables '{"name":"John"}'
```

### Test Send

Quick test with default values:

```bash
k-msg test-send --template TEST_TPL --phone 01012345678
```

## Template Management

### List Templates

```bash
k-msg list-templates --status APPROVED --page 1 --size 10
```

### Create Template

```bash
k-msg create-template --code TPL_001 --name "Welcome" --content "Hello #{name}!" --category NOTIFICATION
```

### Modify Template

```bash
k-msg modify-template --code TPL_001 --name "New Name" --content "New Content"
```

### Delete Template

```bash
k-msg delete-template --code TPL_001
```

## System Commands

- `k-msg health`: Check provider and platform connectivity.
- `k-msg info`: Show platform information and architecture version.

## Architecture

This CLI uses the new **KMsg Architecture**, leveraging:
- `KMsg` client from `@k-msg/messaging`
- `IWINVProvider` and `IWINVAdapter` from `@k-msg/provider`
- `Result` pattern for robust error handling
- `TemplateService` from `@k-msg/template`
