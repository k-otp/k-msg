# @k-msg/channel

> Canonical docs: [k-msg.and.guide](https://k-msg.and.guide)

Channel and sender number management for the K-Message platform.

## Installation

```bash
npm install @k-msg/channel @k-msg/core
# or
bun add @k-msg/channel @k-msg/core
```

## Features

- **Channel Management**: Complete channel lifecycle management
- **Sender Number Registration**: Automated sender number registration and verification
- **Business Verification**: Business information verification for AlimTalk channels
- **Permission Management**: Role-based access control for channels
- **Status Monitoring**: Real-time channel status monitoring

## Runtime Compatibility

- Works in Edge runtimes without `nodejs_compat` (no runtime dependency on Node built-ins).

## Basic Usage

```typescript
import { ChannelService } from '@k-msg/channel';

const channelService = new ChannelService();

// Create a new AlimTalk channel
const channel = await channelService.createChannel({
  name: 'My Business Channel',
  provider: 'iwinv',
  businessInfo: {
    name: 'My Company Ltd.',
    registrationNumber: '123-45-67890',
    category: 'E-COMMERCE',
    contactEmail: 'contact@mycompany.com',
    contactPhone: '02-1234-5678'
  }
});

// Register sender number
const senderNumber = await channelService.addSenderNumber(channel.id, {
  phoneNumber: '15881234',
  purpose: 'MARKETING'
});
```

## Channel Verification

```typescript
// Verify business information
const verification = await channelService.verifyBusiness(channel.id, {
  documents: [
    { type: 'BUSINESS_LICENSE', url: 'https://docs.example.com/license.pdf' },
    { type: 'REPRESENTATIVE_ID', url: 'https://docs.example.com/id.pdf' }
  ]
});

// Check verification status
const status = await channelService.getVerificationStatus(channel.id);
console.log('Verification status:', status);
```

## Sender Number Management

```typescript
// List all sender numbers for a channel
const senderNumbers = await channelService.getSenderNumbers(channel.id);

// Verify sender number with SMS
await channelService.verifySenderNumber(senderNumber.id, '123456');

// Check sender number status
const numberStatus = await channelService.getSenderNumberStatus(senderNumber.id);
```

## License

MIT
