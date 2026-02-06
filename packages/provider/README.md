# @k-msg/provider

Provider system and interfaces for the K-Message platform.

## Installation

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

## Features

- **Complete Provider System**: All-in-one package with providers, adapters, and implementations
- **Built-in IWINV Provider**: Production-ready IWINV AlimTalk integration
- **BaseAlimTalkProvider**: Abstract base class for creating custom providers
- **Request/Response Adapters**: Standardized API communication adapters
- **Provider Registry**: Centralized provider management and registration
- **Contract System**: Modular contract-based architecture
- **Configuration Validation**: Built-in configuration validation with schemas
- **Health Monitoring**: Comprehensive health checks and diagnostics

## Built-in Providers

### IWINV Provider

Production-ready AlimTalk provider with full feature support:

- ✅ AlimTalk message sending with variable substitution
- ✅ SMS/LMS fallback for failed AlimTalk messages
- ✅ Template management (create, update, delete, list)
- ✅ Account balance and profile information
- ✅ Real-time delivery tracking and status updates
- ✅ Channel and sender number management
- ✅ Analytics and usage statistics
- ✅ Configuration validation and health checks

## Basic Usage

```typescript
import { IWINVProvider } from '@k-msg/provider';

// Use the built-in IWINV provider
const iwinvProvider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  debug: false
});

// Send a message
const result = await iwinvProvider.sendMessage({
  templateCode: 'TPL001',
  phoneNumber: '01012345678',
  variables: { code: '123456' }
});

console.log('Message sent:', result.messageId);
```

### Custom Provider Registration

```typescript
import { PluginRegistry } from '@k-msg/provider';

const registry = new PluginRegistry();

// Register a custom provider plugin
await registry.registerPlugin({
  id: 'custom-provider',
  name: 'Custom Provider',
  version: '1.0.0',
  capabilities: {
    messaging: true,
    templates: true,
    analytics: false
  },
  factory: () => new CustomProvider()
});

// Get registered providers
const providers = registry.getRegisteredPlugins();
console.log('Available providers:', providers);
```

## Creating Custom Providers

```typescript
import { BasePlugin } from '@k-msg/provider';

export class CustomProvider extends BasePlugin {
  constructor() {
    super({
      id: 'custom-provider',
      name: 'Custom Provider',
      version: '1.0.0'
    });
  }

  async initialize(config: any): Promise<void> {
    // Initialize provider with configuration
    this.config = config;
  }

  async sendMessage(options: MessageSendOptions): Promise<MessageResult> {
    // Implement message sending logic
    return {
      messageId: 'msg-123',
      status: 'SENT'
    };
  }

  async getHealth(): Promise<HealthStatus> {
    // Implement health check
    return {
      healthy: true,
      latency: 150
    };
  }
}
```

## Service Interfaces

```typescript
import { MessagingService, TemplateService } from '@k-msg/provider';

// Implement messaging service
class CustomMessagingService implements MessagingService {
  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    // Custom implementation
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    // Custom implementation
  }
}
```

## License

MIT
