# IWINV Provider

IWINV provider implementation integrated into the K-Message platform.

## Installation

```bash
npm install @k-msg/provider @k-msg/core
# or
bun add @k-msg/provider @k-msg/core
```

## Features

- **AlimTalk Messaging**: Full IWINV AlimTalk API integration
- **Template Management**: Create, modify, and manage AlimTalk templates
- **Bulk Messaging**: Efficient bulk message sending
- **Delivery Tracking**: Real-time message delivery status
- **Fallback SMS**: Automatic SMS fallback for failed AlimTalk messages
- **Account Management**: Balance checking and usage monitoring

## Basic Usage

```typescript
import { IWINVProvider } from '@k-msg/provider';

const provider = new IWINVProvider({
  apiKey: 'your-iwinv-api-key',
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  debug: false
});

// Send AlimTalk message
const result = await provider.messaging.send({
  templateCode: 'YOUR_TEMPLATE_CODE',
  phoneNumber: '01012345678',
  variables: {
    name: 'John Doe',
    code: '123456'
  },
  options: {
    enableResend: true,
    resendCallback: '15881234',
    resendType: 'custom',
    resendContent: 'Your verification code is 123456'
  }
});

console.log('Message ID:', result.messageId);
```

## Template Management

```typescript
// Create a new template
const template = await provider.templates.create({
  name: 'OTP Verification',
  content: '[YourApp] Your verification code is #{code}. Valid for 10 minutes.',
  category: 'AUTHENTICATION'
});

// List templates
const templates = await provider.templates.list({
  status: 'APPROVED',
  page: 1,
  size: 20
});

// Update template
await provider.templates.update(template.templateId, {
  name: 'Updated OTP Template',
  content: '[YourApp] Verification code: #{code}'
});
```

## Account Information

```typescript
// Check account balance
const balance = await provider.account.getBalance();
console.log('Current balance:', balance.current, balance.currency);

// Get account profile
const profile = await provider.account.getProfile();
console.log('Account tier:', profile.tier);
console.log('Daily limit:', profile.limits.dailyMessageLimit);
```

## Health Monitoring

```typescript
// Perform health check
const health = await provider.healthCheck();
if (health.healthy) {
  console.log('Provider is healthy');
  console.log('Latency:', health.latency, 'ms');
} else {
  console.log('Provider issues:', health.issues);
}
```

## Configuration

Required environment variables:

```bash
IWINV_API_KEY=your_api_key_here
IWINV_BASE_URL=https://alimtalk.bizservice.iwinv.kr
```

## License

MIT
