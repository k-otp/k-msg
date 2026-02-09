# k-msg

🚀 **Korean Multi-Channel Messaging Platform** - The complete solution for AlimTalk, FriendTalk, SMS, and LMS messaging in Korea.

[![npm version](https://badge.fury.io/js/k-msg.svg)](https://badge.fury.io/js/k-msg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Installation

```bash
# Using npm
npm install k-msg

# Using bun (recommended)
bun add k-msg

# Using yarn
yarn add k-msg
```

## Features

### 🌟 **Core Capabilities**
- **🏢 Multi-Provider Support** - IWINV, Aligo, Kakao Business, NHN KCP
- **💬 Rich Messaging** - AlimTalk, FriendTalk, SMS, LMS with media support
- **🔄 Smart Fallback** - Automatic provider switching and message type fallback
- **📱 Mobile-First** - Optimized for Korean mobile messaging ecosystem

### 🛠️ **Developer Experience**
- **📝 Template Engine** - Dynamic templates with variable substitution (`#{variable}`)
- **🔒 Type Safety** - Full TypeScript support with strict type checking
- **🧪 Testing Tools** - Built-in test utilities and mock providers
- **📚 Rich Documentation** - Comprehensive guides and API references

### 📊 **Analytics & Monitoring**
- **📈 Real-time Analytics** - Message delivery, open rates, click tracking
- **🎯 Smart Insights** - AI-powered optimization recommendations
- **🚨 Health Monitoring** - Provider health checks and system monitoring
- **📋 Custom Reports** - Flexible reporting with CSV/JSON export

### ⚡ **Performance & Reliability**
- **🔄 Retry Logic** - Exponential backoff with jitter
- **🚦 Rate Limiting** - Built-in rate limiting and queue management
- **🎪 Circuit Breaker** - Automatic failure recovery
- **📡 Webhook System** - Real-time event notifications

## 🚀 Quick Start

### Basic Usage with KMsg

```typescript
import { KMsg, IWINVProvider, ok, fail } from 'k-msg';

// Initialize KMsg with IWINV provider
const kmsg = new KMsg(new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
}));

// Send an SMS message
const smsResult = await kmsg.send({
  type: 'SMS',
  to: '01012345678',
  from: '01000000000',
  text: 'Hello #{name}, this is a test SMS!',
  variables: { name: '홍길동' }
});

if (result.isSuccess) {
  console.log('✅ Message sent successfully:', result.value.messageId);
} else {
  console.error('❌ Failed to send message:', result.error.message);
}
```

### Manual Adapter Setup (Advanced)

```typescript
import { IWINVAdapter, KMsg } from 'k-msg';

// Create adapter instance
const adapter = new IWINVAdapter({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  senderNumber: '01012345678'
});

// Create KMsg client with custom adapter
const kmsg = new KMsg(adapter);

// Send message with full control
const result = await kmsg.send({
  type: 'ALIMTALK',
  templateId: 'AUTH_OTP',
  to: '01012345678',
  variables: {
    name: '김철수',
    code: '987654'
  }
});
```

## 📚 Detailed Usage Guide

### Template Management

```typescript
import { IWINVAdapter, TemplateService } from 'k-msg';

const adapter = new IWINVAdapter(config);
const templateService = new TemplateService(adapter);

// Create a new template
const template = await templateService.create({
  code: 'order_confirmation',
  name: 'order_confirmation',
  content: '주문이 완료되었습니다. 주문번호: #{orderNumber}',
  category: 'TRANSACTION'
});

// List all templates
const result = await templateService.list();
if (result.isSuccess) {
  console.log('Available templates:', result.value.length);
}
```

### Error Handling with Result Pattern

```typescript
import { KMsg, ok, fail } from 'k-msg';

const result = await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'template_name',
  variables: {}
});

if (result.isFailure) {
  // Handle failure
  const error = result.error;
  console.error('Send failed:', error.message);
  
  // You can check error codes or types
  if (error.message.includes('template not found')) {
    // Handle specific error
  }
} else {
  // Handle success
  const { messageId, status } = result.value;
  console.log(`Success: ${messageId} (${status})`);
}
```

## Template Management

```typescript
// Create template
const templates = await platform.templates();
const newTemplate = await templates.create(
  'welcome_message',
  'Welcome #{name}! Your account is ready.',
  'GENERAL'
);

// List templates
const templateList = await templates.list(1, 20);
```

## Analytics & Monitoring

```typescript
import { AnalyticsService, InsightEngine } from 'k-message';

const analytics = new AnalyticsService();

// Get delivery metrics
const metrics = await analytics.getDeliveryMetrics({
  timeRange: '24h',
  provider: 'iwinv'
});

// Generate insights
const insights = new InsightEngine();
const recommendations = await insights.generateInsights(metrics);
```

## Webhook Integration

```typescript
import { WebhookManager } from 'k-message';

const webhookManager = new WebhookManager();

// Register webhook endpoint
await webhookManager.registerEndpoint({
  url: 'https://your-app.com/webhook',
  events: ['MESSAGE_SENT', 'MESSAGE_DELIVERED', 'MESSAGE_FAILED'],
  secret: 'your-webhook-secret'
});
```

## 📦 Package Architecture

k-msg is built as a modular monorepo. You can install the complete package or individual components:

### Complete Package (Recommended)
```bash
bun add k-msg  # Includes all packages
```

### Individual Packages

| Package | Description | Usage |
|---------|-------------|-------|
| `@k-msg/core` | Foundation (types, errors, retry) | Base types and error handling |
| `@k-msg/provider` | Provider system (IWINV, etc.) | Multi-provider abstraction |
| `@k-msg/messaging` | Message sending & queues | Core messaging functionality |
| `@k-msg/template` | Template parsing & management | Dynamic template system |
| `@k-msg/analytics` | Metrics & reporting | Performance analytics |
| `@k-msg/webhook` | Event notifications | Real-time webhooks |
| `@k-msg/channel` | Channel & sender management | Business verification |

### Dependency Graph
```
core (foundation)
├── provider → core
├── template → core
├── messaging → core, provider, template
├── analytics → core, messaging
├── webhook → core, messaging
├── channel → core
└── k-msg → all packages
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required
IWINV_API_KEY=your-iwinv-api-key

# Optional
IWINV_BASE_URL=https://alimtalk.bizservice.iwinv.kr
NODE_ENV=development
PORT=3000

# Debug mode
DEBUG=k-msg:*
```

### TypeScript Configuration

```typescript
interface MessageServiceConfig {
  apiKey: string;
  baseUrl?: string;
  debug?: boolean;
  autoLoad?: boolean;
  timeout?: number;
  retryAttempts?: number;
  
  // Advanced options
  customHandlers?: {
    templateLoader?: (provider: Provider) => Promise<Template[]>;
    errorHandler?: (error: Error, context: string) => void;
  };
  
  // Provider-specific settings
  providerSpecific?: {
    iwinv?: {
      templateCategories?: string[];
      maxVariables?: number;
      enableBulkSending?: boolean;
    };
  };
}
```

### Factory Configuration Options

```typescript
// Simple configuration
const service1 = MessageServiceFactory.createIWINVService({
  apiKey: 'your-key',
  debug: true
});

// Advanced configuration
const service2 = MessageServiceFactory.createService(provider, {
  debug: true,
  autoLoad: false,
  customHandlers: {
    errorHandler: (error, context) => {
      console.error(`[${context}] ${error.message}`);
      // Send to monitoring service
    }
  },
  providerSpecific: {
    iwinv: {
      templateCategories: ['AUTHENTICATION', 'NOTIFICATION'],
      enableBulkSending: false
    }
  }
});
```

## 🧪 Testing

```typescript
import { MessageServiceFactory, TestUtils } from 'k-msg';

// Create test service with mock provider
const testService = MessageServiceFactory.createIWINVService({
  apiKey: 'test-key',
  debug: true
});

// Test message sending
const result = await testService.sendMessage(
  '01012345678',
  'test_template',
  { name: '테스트 사용자' }
);

// Use test utilities
const testMessage = TestUtils.createTestMessage({
  templateCode: 'AUTH_OTP',
  phoneNumber: '01012345678'
});

const mockResult = TestUtils.createMockResult({
  success: true,
  messageId: 'test-message-001'
});
```

### Run Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific package tests
bun test packages/core
bun test packages/messaging

# Run tests by type
bun test:unit        # Fast unit tests
bun test:integration # Integration tests
bun test:e2e         # End-to-end tests (requires real API keys)
```

## 📖 Examples

Check out the `/examples` directory for complete working examples:

- **Basic Usage** - Simple message sending
- **Web Server** - Hono/Express integration
- **Bulk Messaging** - Batch message processing  
- **Template Management** - Dynamic template creation
- **Analytics Dashboard** - Real-time monitoring
- **Webhook Integration** - Event-driven architecture

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/k-otp/k-msg.git
cd k-msg

# Install dependencies
bun install

# Build all packages
bun run build:all

# Run tests
bun test

# Start development server
bun run dev
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/k-otp/k-msg/wiki)
- **API Reference**: [TypeDoc](https://k-otp.github.io/k-msg/)
- **Issues**: [GitHub Issues](https://github.com/k-otp/k-msg/issues)
- **Discussions**: [GitHub Discussions](https://github.com/k-otp/k-msg/discussions)
- **Discord**: [Join our Discord](https://discord.gg/k-msg)

### Commercial Support

For enterprise support, consulting, or custom integrations, please contact us at [support@k-msg.dev](mailto:support@k-msg.dev).

---

**Made with ❤️ for the Korean developer community**

*K-Message is not affiliated with Kakao Corp or any messaging service providers.*
