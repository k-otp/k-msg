---
title: "@k-msg/template"
description: "Generated from `packages/template/README.md`"
---
Single source of truth for K-Message template runtime lifecycle, payload validation, and personalization.

## Installation

```bash
npm install @k-msg/template @k-msg/core
# or
bun add @k-msg/template @k-msg/core
```

## Runtime API (`@k-msg/template`)

Main exports focus on runtime-safe template workflows:

- `TemplateLifecycleService`
- `TemplatePersonalizer`, `defaultTemplatePersonalizer`, `TemplateVariableUtils`
- `interpolate`
- `validateTemplatePayload`, `parseTemplateButtons`
- low-level parsers (`ButtonParser`, `VariableParser`, `TemplateValidator`)

### Lifecycle Service

```typescript
import { TemplateLifecycleService } from "@k-msg/template";
import type { TemplateProvider } from "@k-msg/core";

const provider: TemplateProvider = /* your provider */;
const templates = new TemplateLifecycleService(provider);

await templates.create({
  name: "OTP Verification",
  content: "[MyApp] Code: #{code}",
});
```

### Runtime Validation

```typescript
import { parseTemplateButtons, validateTemplatePayload } from "@k-msg/template";

const buttons = parseTemplateButtons('[{"type":"WL","name":"Open","url_mobile":"https://example.com"}]');
if (buttons.isFailure) throw buttons.error;

const payload = validateTemplatePayload(
  {
    name: "Notice",
    content: "Hello #{name}",
    buttons: buttons.value,
  },
  { requireName: true, requireContent: true },
);

if (payload.isFailure) throw payload.error;
```

### Personalization

```typescript
import { TemplateVariableUtils } from "@k-msg/template";

const rendered = TemplateVariableUtils.replace("Hello #{name}", {
  name: "Jane",
});
// "Hello Jane"
```

## Toolkit API (`@k-msg/template/toolkit`)

Builder/registry/testing helpers are exposed separately:

- `TemplateBuilder`, `TemplateBuilders`
- `TemplateRegistry`
- `InMemoryTemplateStore`

```typescript
import { TemplateRegistry, TemplateBuilders } from "@k-msg/template/toolkit";

const registry = new TemplateRegistry();
const template = TemplateBuilders.authentication("OTP", "mock")
  .code("OTP_001")
  .content("Code: #{code}")
  .build();

await registry.register(template);
```

## License

MIT

