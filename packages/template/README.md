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
import { TemplateService, TemplateValidator } from '@k-msg/template';

const templateService = new TemplateService();

// Create a new template
const template = await templateService.create({
  name: 'OTP Verification',
  content: '[MyApp] Your verification code is #{code}. Valid for 10 minutes.',
  category: 'AUTHENTICATION',
  variables: ['code']
});

// Validate template
const validator = new TemplateValidator();
const validation = validator.validate(template.content);

if (validation.isValid) {
  console.log('Template is valid');
  console.log('Variables found:', validation.variables);
} else {
  console.log('Validation errors:', validation.errors);
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