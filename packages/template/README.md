# @k-msg/template

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

## Basic Usage

```typescript
import { TemplateService } from '@k-msg/template';
import { IWINVAdapter } from '@k-msg/provider';

const adapter = new IWINVAdapter(config);
const templateService = new TemplateService(adapter);

// Create a new template
const result = await templateService.create({
  code: 'OTP_001',
  name: 'OTP Verification',
  content: '[MyApp] Your verification code is #{code}.',
  category: 'AUTHENTICATION'
});

if (result.isSuccess) {
  const template = result.value;
  console.log('Template created:', template.id);
}
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

## License

MIT