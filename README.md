# K-msg Platform

🏃‍♂️ **Powered by [Bun](https://bun.sh)** - The all-in-one JavaScript runtime

Korean Multi-Channel Messaging Platform - Integrated solution for AlimTalk, FriendTalk, SMS, and LMS

An open-source platform for unified management of various messaging channels, from AlimTalk to SMS.

## 🚀 Why Bun?

This project is built with **Bun** for maximum performance and developer experience:

- ⚡ **Lightning Fast**: Up to 4x faster than Node.js for most operations
- 🔧 **All-in-One**: Runtime, bundler, test runner, and package manager in one tool
- 🎯 **Zero Config**: No webpack, babel, or complex build setup needed
- 📦 **Native TypeScript**: Run `.ts` files directly without compilation
- 🌐 **Built-in Web APIs**: WebSocket, fetch, and modern APIs out of the box
- 🧪 **Fast Testing**: Built-in test runner with Jest-compatible API

## ✨ Key Features

- 🔌 **Multi-Provider Support**: IWINV, Kakao, NHN and other providers
- 📱 **Multi-Channel Messaging**: AlimTalk, FriendTalk, SMS, LMS, MMS integration
- 🎨 **Template Engine**: Powerful variable substitution and template management
- ⚡ **Bulk Sending**: Efficient batch processing and queue system
- 📊 **Real-time Monitoring**: Delivery status and success rate tracking
- 🛠️ **CLI Tool**: Developer-friendly command line interface
- 🌐 **Web Dashboard**: Intuitive management interface

## 🏗️ Architecture

```
k-msg-platform/
├── packages/                          # Core packages
│   ├── core/                          # Platform core interfaces
│   ├── messaging/                     # Messaging engine & queue system
│   ├── template/                      # Template parsing & variable substitution
│   ├── channel/                       # Channel & sender number management
│   ├── provider/                      # Provider system with IWINV implementation
│   ├── analytics/                     # Statistics & analytics engine
│   └── webhook/                       # Real-time event notifications
└── apps/                              # Applications
    ├── cli/                           # CLI tool
    └── admin-dashboard/               # Web dashboard
```

## 📦 Packages

### Core Packages

- **`@k-msg/core`** - Platform core interfaces and types
- **`@k-msg/provider`** - Complete provider system with IWINV implementation
- **`@k-msg/messaging`** - Message sending and queue system  
- **`@k-msg/template`** - Template management and variable substitution
- **`@k-msg/channel`** - Channel and sender number management
- **`@k-msg/analytics`** - Analytics and reporting engine
- **`@k-msg/webhook`** - Event-based webhook processing

### Unified Package

- **`k-msg`** - All-in-one package that re-exports everything

## 🚀 Quick Start

### 1. Installation

**Using Bun (Recommended)**:
```bash
bun add k-msg
```

**Using npm**:
```bash
npm install k-msg
```

### 2. Basic Usage

```typescript
import { KMsg, IWINVProvider, ok, fail } from 'k-msg';

// Initialize KMsg with IWINV provider
const kmsg = new KMsg(new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
}));

// Send an AlimTalk message
const result = await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'welcome_template',
  variables: {
    name: 'John Doe',
    service: 'MyApp'
  }
});

if (result.isSuccess) {
  console.log('Message sent:', result.value.messageId);
} else {
  console.error('Failed to send:', result.error.message);
}
```

### 3. Template Management

```typescript
import { TemplateService } from '@k-msg/template';
import { IWINVAdapter } from '@k-msg/provider';

const adapter = new IWINVAdapter({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
});
const templateService = new TemplateService(adapter);

// Create a new template
const result = await templateService.create({
  code: 'WELCOME_001',
  name: 'welcome_message',
  content: 'Hello #{name}, welcome!',
  category: 'NOTIFICATION'
});
```

## 🔌 Providers

### IWINV Provider

The IWINV provider is now integrated directly into `@k-msg/provider`:

```typescript
import { IWINVProvider } from '@k-msg/provider';
// or from unified package
import { IWINVProvider } from 'k-msg';

const provider = new IWINVProvider({
  apiKey: 'your-iwinv-api-key',
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  timeout: 30000,
  retries: 3,
  debug: false
});

// Features:
// ✅ Message sending
// ✅ Bulk sending  
// ✅ Scheduled sending
// ✅ Template management
// ✅ Delivery history
// ✅ Balance inquiry
```

## 📚 Documentation

### Template Management

```typescript
import { TemplateService } from '@k-msg/template';
import { IWINVAdapter } from '@k-msg/provider';

const adapter = new IWINVAdapter(config);
const templateService = new TemplateService(adapter);

// List templates
const result = await templateService.list({ status: 'APPROVED' });
if (result.isSuccess) {
  console.log('Templates:', result.value);
}
```

### Message Sending

```typescript
import { KMsg, BulkMessageSender } from '@k-msg/messaging';
import { IWINVProvider } from '@k-msg/provider';

const kmsg = new KMsg(new IWINVProvider(config));
const bulkSender = new BulkMessageSender(kmsg);

// Single message (AlimTalk)
const result = await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'TPL_001',
  variables: { name: 'User' }
});

// Bulk messages
const bulkResult = await bulkSender.sendBulk({
  templateId: 'TPL_001',
  recipients: [
    { to: '01011112222', variables: { name: 'User 1' } },
    { to: '01033334444', variables: { name: 'User 2' } }
  ]
});
```

### Channel Management

```typescript
import { KakaoChannelManager } from '@k-msg/channel';

const channelManager = new KakaoChannelManager();

// Create channel
const channel = await channelManager.createChannel(channelRequest);

// Add sender number
const senderNumber = await channelManager.addSenderNumber(channelId, number);
```

## 🛠️ CLI Usage

The platform comes with a powerful CLI tool for management:

```bash
# Send a message
bun apps/cli/src/cli.ts send --template welcome_tpl --phone 01012345678

# List templates
bun apps/cli/src/cli.ts list-templates --status APPROVED

# Check health
bun apps/cli/src/cli.ts health
```

For more details, see [apps/cli/README.md](./apps/cli/README.md).

## 🛠️ Development

### Bun-Powered Development Experience

- 🔥 **Hot Module Reloading**: Instant feedback with `bun --hot`
- 📦 **Package Management**: Use `bun pm` for advanced package operations
- 🚀 **Zero-Config Bundling**: Built-in support for TypeScript, JSX, and more
- ⚡ **Fast Installs**: Dependencies install 25x faster than npm

### Development Commands

```bash
# Start development server with hot reloading
bun --hot src/index.ts

# Run with environment variables
bun --env-file=.env src/index.ts

# Execute TypeScript directly (no compilation step)
bun run src/my-script.ts

# Package management
bun pm pack          # Create tarball
bun pm ls           # List dependencies
bun pm cache rm     # Clear cache
```

### Prerequisites

**Install Bun** (if not already installed):
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Environment Setup

```bash
# Install dependencies (super fast with Bun!)
bun install

# Set environment variables
export IWINV_API_KEY="your-iwinv-api-key"
export IWINV_BASE_URL="https://alimtalk.bizservice.iwinv.kr"
```

### Build

```bash
# Build all packages (using Bun's ultra-fast bundler)
bun run build:all

# Build specific package
cd packages/provider && bun run build

# Watch mode for development
bun run dev
```

### Testing

```bash
# Run all tests (with Bun's built-in test runner)
bun test

# Test specific package
cd packages/template && bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage
```

## 📊 Package Status

All packages are 100% complete and tested:

- ✅ **@k-msg/core** (100%) - Provider abstraction layer
- ✅ **@k-msg/provider** (100%) - Complete provider system with IWINV
- ✅ **@k-msg/template** (100%) - Template management and variable substitution
- ✅ **@k-msg/messaging** (100%) - Message sending and queue system  
- ✅ **@k-msg/channel** (100%) - Channel and sender number management
- ✅ **@k-msg/analytics** (100%) - Real-time analytics and reporting
- ✅ **@k-msg/webhook** (100%) - Event-based webhook processing
- ✅ **k-msg** (100%) - Unified package
- ✅ **Integration Tests** - Cross-package integration verified

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Korean Documentation](./README_ko.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./docs/api.md)
- [Provider Guide](./docs/providers.md)
- [Contributing Guide](./CONTRIBUTING.md)

## 🔧 Technical Stack

- **Runtime**: [Bun](https://bun.sh) - All-in-one JavaScript runtime
- **Language**: TypeScript with native support
- **Testing**: Bun's built-in test runner
- **Bundling**: Bun's native bundler (no webpack needed)
- **Package Manager**: Bun's ultra-fast package manager

## ⚠️ Known Issues with Bun Build

### CommonJS Export Issues

While Bun provides excellent performance and developer experience, there are some known issues with CommonJS (CJS) build output:

#### 1. **Named Exports Conversion Problems** ([#12463](https://github.com/oven-sh/bun/issues/12463))
- Built CJS modules may not support named imports interchangeably with the original
- **Workaround**: Use default imports and destructure:
  ```typescript
  // Instead of: import { namedExport } from 'module'
  import pkg from 'module';
  const { namedExport } = pkg;
  ```

#### 2. **ESM/CJS Interop Edge Cases** ([#5654](https://github.com/oven-sh/bun/issues/5654))
- Reference errors when importing CJS code with `__esModule: true`
- **Workaround**: Use namespace imports:
  ```typescript
  import * as module from 'module';
  module.namedExport();
  ```

#### 3. **Strange CJS Output Behavior** ([#14532](https://github.com/oven-sh/bun/issues/14532))
- Code may execute twice in some CJS build scenarios
- **Workaround**: Use ESM format when possible:
  ```bash
  bun build --format esm  # instead of --format cjs
  ```

### Our Current Solution

This project uses **dual module format** (ESM + CJS) with careful dependency management:

```json
{
  "main": "./dist/index.js",     // CJS for Node.js compatibility
  "module": "./dist/index.mjs",  // ESM for modern bundlers
  "types": "./dist/index.d.ts",  // TypeScript definitions
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

These issues are actively being addressed by the Bun team, and the benefits of using Bun still outweigh these temporary limitations for most use cases.

## 📞 Support

- GitHub Issues: Bug reports and feature requests
- Email: <support@k-msg.dev>
- Documentation: [docs.k-msg.dev](https://docs.k-msg.dev)
- Bun Resources: [bun.sh/docs](https://bun.sh/docs)
- Bun Issues: [github.com/oven-sh/bun/issues](https://github.com/oven-sh/bun/issues)

---

## K-OTP (Commercial Service)

K-OTP is a professional OTP authentication service built on this platform.

### Installation

```bash
npm install k-otp
```

### Better Auth Plugin

```typescript
import { betterAuth } from "better-auth";
import { kotpPlugin } from "k-otp/better-auth";

export const auth = betterAuth({
  plugins: [
    kotpPlugin({
      apiKey: process.env.K_OTP_API_KEY!,
      baseURL: "https://api.k-otp.dev",
      templateId: "auth_otp",
      autoSignIn: true,
      maxAttempts: 3,
      resendDelay: 60
    })
  ]
});
```

### React Components

```tsx
import { OTPForm, OTPInput } from "k-otp/better-auth/react";

function AuthPage() {
  return (
    <OTPForm
      onSuccess={(result) => console.log("Authentication successful:", result)}
      onError={(error) => console.error("Authentication failed:", error)}
    />
  );
}
```

For detailed K-OTP usage, see [commercial/k-otp/README.md](./commercial/k-otp/README.md).
