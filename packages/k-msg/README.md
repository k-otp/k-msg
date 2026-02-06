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

### Method 1: Using MessageServiceFactory (Recommended)

```typescript
import { MessageServiceFactory } from 'k-msg';

// Create service with auto-loading
const kmsg = MessageServiceFactory.createIWINVService({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: process.env.IWINV_BASE_URL,
  debug: true,
  autoLoad: true // Automatically loads channels and templates
});

// Wait a moment for auto-loading to complete
await new Promise(resolve => setTimeout(resolve, 2000));

// Send a message
const result = await kmsg.sendMessage(
  '01012345678',
  'welcome_template',
  {
    customerName: '홍길동',
    serviceName: 'K-Message',
    verificationCode: '123456'
  }
);

if (result.success) {
  console.log('✅ Message sent successfully:', result.messageId);
} else {
  console.error('❌ Failed to send message:', result.error);
}
```

### Method 2: Manual Provider Setup

```typescript
import { IWINVProvider, MessageService } from 'k-msg';

// Create provider instance
const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  debug: true
});

// Create message service
const messageService = new MessageService([provider]);

// Send message with full control
const result = await messageService.send({
  templateCode: 'AUTH_OTP',
  phoneNumber: '01012345678',
  variables: {
    name: '김철수',
    code: '987654'
  }
});
```

### Method 3: Web Server Integration

```typescript
import { Hono } from 'hono';
import { MessageServiceFactory } from 'k-msg';

const app = new Hono();
const kmsg = MessageServiceFactory.createIWINVService({
  apiKey: process.env.IWINV_API_KEY!,
  autoLoad: true
});

// Health check endpoint
app.get('/health', async (c) => {
  const health = await kmsg.healthCheck();
  return c.json(health);
});

// Send message endpoint
app.post('/send', async (c) => {
  const { phoneNumber, templateName, variables } = await c.req.json();
  
  const result = await kmsg.sendMessage(phoneNumber, templateName, variables);
  return c.json(result);
});

// Start server
export default { port: 3000, fetch: app.fetch };
```

## 📚 Detailed Usage Guide

### Template Management

```typescript
// Create a new template
const template = await kmsg.createTemplate(
  'order_confirmation',
  '주문이 완료되었습니다. 주문번호: #{orderNumber}, 고객명: #{customerName}',
  'TRANSACTION'
);

if (template.success) {
  console.log('Template created:', template.template.name);
}

// List all templates (local + provider)
const templates = kmsg.getTemplates('all');
console.log('Available templates:', templates.templates.length);

// Get templates from specific source
const providerTemplates = kmsg.getTemplates('provider');
const localTemplates = kmsg.getTemplates('local');
```

### Channel Management

```typescript
// Get available channels
const channels = kmsg.getChannels();
console.log('Available channels:', channels.channels.length);

// Refresh provider data
const refreshResult = await kmsg.refreshProviderData();
console.log('Data refreshed:', refreshResult.success);
```

### Analytics and Monitoring

```typescript
// Get analytics data
const analytics = await kmsg.getAnalytics();
console.log('Messages sent:', analytics.analytics.messagesSent);
console.log('Success rate:', analytics.analytics.successRate + '%');

// IWINV-specific features
const balance = await kmsg.getIWINVBalance();
console.log('Account balance:', balance);

const history = await kmsg.getIWINVHistory(1, 10);
console.log('Recent messages:', history);
```

### Error Handling

```typescript
import { KMessageError, KMessageErrorCode } from 'k-msg';

try {
  const result = await kmsg.sendMessage('01012345678', 'template_name', {});
  
  if (!result.success) {
    // Handle business logic errors
    console.error('Send failed:', result.error);
    
    // Check specific error types
    if (result.error.includes('template not found')) {
      // Create template or use fallback
    } else if (result.error.includes('insufficient balance')) {
      // Handle billing issues
    }
  }
} catch (error) {
  // Handle system errors
  if (error instanceof KMessageError) {
    console.error('System error:', error.code, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
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
