# @k-msg/core

The foundational package of the K-Message platform, providing essential types, error handling, retry mechanisms, and platform interfaces for Korean multi-channel messaging.

## Installation

```bash
npm install @k-msg/core
# or
bun add @k-msg/core
```

## Features

### 🏗️ **Core Platform Interface**
- **AlimTalkPlatform**: Unified messaging platform abstraction
- **Provider Management**: Multi-provider support and switching
- **Feature Flags**: Configurable platform capabilities

### 🔁 **Provider Rotation**
- **RoundRobinRouterProvider**: Rotate across multiple upstream providers (round-robin)

### ⚠️ **Comprehensive Error Handling**
- **KMessageError Hierarchy**: Structured error types for different scenarios
- **Error Context**: Rich error information with operation context
- **Error Recovery**: Built-in fallback and recovery strategies

### 🔄 **Retry & Resilience**
- **Exponential Backoff**: Smart retry with increasing delays
- **Circuit Breaker**: Automatic failure protection
- **Jitter**: Randomized delays to prevent thundering herd

### 💊 **Health Monitoring**
- **System Health Checks**: Multi-component health validation
- **Service Discovery**: Dynamic provider health monitoring
- **Dependency Tracking**: External service availability checks

## Quick Start

### Basic Platform Setup

```typescript
import { AlimTalkPlatform } from '@k-msg/core';

const platform = new AlimTalkPlatform({
  providers: ['iwinv'],
  defaultProvider: 'iwinv',
  features: {
    enableBulkSending: true,
    enableScheduling: true,
    enableAnalytics: true
  }
});

// Get platform capabilities
const info = platform.getInfo();
console.log(`Platform: ${info.name}, Version: ${info.version}`);
console.log(`Supported providers: ${info.supportedProviders.join(', ')}`);

// Perform comprehensive health check
const health = await platform.healthCheck();
console.log(`Health: ${health.status}, Services: ${Object.keys(health.services).length}`);
```

### Round-robin Provider Rotation

```typescript
import { RoundRobinRouterProvider, type BaseProvider } from "@k-msg/core";

const router = new RoundRobinRouterProvider({
  id: "router",
  providers: [providerA, providerB] satisfies BaseProvider[],
});

await router.send({
  channel: "SMS",
  templateCode: "SMS_DIRECT",
  phoneNumber: "01012345678",
  variables: {},
  text: "hello",
});
```

### Error Handling Patterns

```typescript
import { KMessageError, KMessageErrorCode, Result } from '@k-msg/core';

// Method 1: Result Pattern (Recommended)
const result = await Result.fromPromise(
  provider.sendMessage(message)
);

if (result.isSuccess) {
  console.log(`Message sent: ${result.data.messageId}`);
} else {
  console.error(`Send failed: ${result.error.message}`);
  
  // Handle specific error types
  if (result.error.code === KMessageErrorCode.PROVIDER_TIMEOUT) {
    // Retry with different provider
  } else if (result.error.code === KMessageErrorCode.TEMPLATE_NOT_FOUND) {
    // Create template or use fallback
  }
}

// Method 2: Try-Catch with Structured Errors
try {
  const response = await provider.sendMessage(message);
  console.log('Success:', response);
} catch (error) {
  if (error instanceof KMessageError) {
    console.error(`[${error.code}] ${error.message}`);
    console.error('Context:', error.context);
    
    // Access original cause if available
    if (error.cause) {
      console.error('Root cause:', error.cause);
    }
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### Retry Configuration

```typescript
import { RetryManager, RetryConfig } from '@k-msg/core';

// Custom retry configuration
const retryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1 second
  maxDelay: 10000,      // 10 seconds
  backoffMultiplier: 2,
  jitterType: 'full',   // full, half, none
  retryableErrors: [
    KMessageErrorCode.NETWORK_ERROR,
    KMessageErrorCode.PROVIDER_TIMEOUT,
    KMessageErrorCode.RATE_LIMIT_EXCEEDED
  ]
};

const retryManager = new RetryManager(retryConfig);

// Execute with retry
const result = await retryManager.execute(async () => {
  return await provider.sendMessage(message);
});
```

### Health Check Implementation

```typescript
import { HealthChecker, HealthStatus } from '@k-msg/core';

const healthChecker = new HealthChecker();

// Register custom health checks
healthChecker.register('database', async () => {
  const connected = await checkDatabaseConnection();
  return {
    status: connected ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
    details: { connected, lastCheck: new Date() }
  };
});

healthChecker.register('external-api', async () => {
  const responseTime = await measureApiResponseTime();
  return {
    status: responseTime < 1000 ? HealthStatus.HEALTHY : HealthStatus.DEGRADED,
    details: { responseTime, threshold: 1000 }
  };
});

// Perform comprehensive health check
const overallHealth = await healthChecker.checkAll();
console.log(`Overall status: ${overallHealth.status}`);
console.log(`Healthy services: ${overallHealth.healthyCount}/${overallHealth.totalCount}`);
```

## API Reference

### Core Types

```typescript
// Platform configuration
interface AlimTalkPlatformConfig {
  providers: string[];
  defaultProvider: string;
  features: PlatformFeatures;
  retryConfig?: RetryConfig;
  healthCheckConfig?: HealthCheckConfig;
}

// Error types
enum KMessageErrorCode {
  UNKNOWN = 'UNKNOWN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  // ... more error codes
}

// Health check results
interface HealthCheckResult {
  status: HealthStatus;
  services: Record<string, ServiceHealthInfo>;
  timestamp: Date;
  totalChecks: number;
  passedChecks: number;
}
```

### Test Utilities

```typescript
import { TestData, TestAssertions } from '@k-msg/core/test-utils';

// Generate test data
const testMessage = TestData.createMessage({
  provider: 'iwinv',
  templateCode: 'AUTH_OTP',
  phoneNumber: '01012345678'
});

// Test assertions
await TestAssertions.assertMessageSent(result);
TestAssertions.assertErrorType(error, KMessageErrorCode.TEMPLATE_NOT_FOUND);
```

## Advanced Usage

### Custom Error Types

```typescript
import { KMessageError, KMessageErrorCode } from '@k-msg/core';

class CustomProviderError extends KMessageError {
  constructor(
    message: string,
    public readonly providerId: string,
    cause?: Error
  ) {
    super(
      message,
      KMessageErrorCode.PROVIDER_ERROR,
      { operation: 'send_message', provider: providerId },
      cause
    );
  }
}
```

### Plugin Integration

```typescript
import { AlimTalkPlatform, PlatformPlugin } from '@k-msg/core';

class LoggingPlugin implements PlatformPlugin {
  name = 'logging';
  
  async initialize(platform: AlimTalkPlatform) {
    platform.on('message_sent', (event) => {
      console.log(`Message sent: ${event.messageId}`);
    });
    
    platform.on('error', (event) => {
      console.error(`Error: ${event.error.message}`);
    });
  }
}

const platform = new AlimTalkPlatform(config);
await platform.use(new LoggingPlugin());
```

## Best Practices

1. **Always use Result pattern** for error handling in production code
2. **Configure retries** appropriately for your use case
3. **Implement health checks** for all external dependencies
4. **Use structured logging** with error context information
5. **Monitor error rates** and adjust retry policies accordingly

## Testing

```bash
# Run unit tests
bun test

# Run with coverage
bun test --coverage

# Run specific test files
bun test retry.test.ts
```

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.
