# @k-msg/template

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

Template management and validation system for the K-Message platform.

## Installation

```bash
npm install @k-msg/template @k-msg/core
# or
bun add @k-msg/template @k-msg/core
```

## Features

- **Template Engine**: Comprehensive template management system
- **Variable Parsing**: Automatic template variable extraction and validation
- **Template Validation**: Built-in validation for template content and structure
- **Template Registry**: Centralized template storage and retrieval
- **Template Builder**: Dynamic template creation and modification

## Runtime Compatibility

- Works in Edge runtimes without `nodejs_compat` (no runtime dependency on Node built-ins).

## Basic Usage

```typescript
import { interpolate } from '@k-msg/template';

const text = interpolate('[MyApp] Your verification code is #{code}.', {
  code: '123456',
});

console.log(text); // "[MyApp] Your verification code is 123456."
```

## Template Registry

```typescript
import { TemplateRegistry } from '@k-msg/template';

const registry = new TemplateRegistry();

// Register a template
await registry.register({
  id: 'otp-basic',
  name: 'Basic OTP Template',
  content: '[#{service}] Verification code: #{code}',
  category: 'AUTHENTICATION'
});

// Search templates
const templates = await registry.search({
  category: 'AUTHENTICATION',
  status: 'ACTIVE'
});
```

## Provider-backed TemplateService (Optional)

`TemplateService` is a small helper around the `TemplateProvider` interface from
`@k-msg/core`.

```typescript
import { TemplateService } from '@k-msg/template';
import type { TemplateProvider } from '@k-msg/core';

const provider: TemplateProvider = /* your implementation */;
const templateService = new TemplateService(provider);

await templateService.create({
  code: 'OTP_001',
  name: 'OTP Verification',
  content: '[MyApp] Your verification code is #{code}.',
  category: 'AUTHENTICATION'
});
```

## License

MIT
