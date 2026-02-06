# @k-msg/messaging

Messaging and delivery tracking system for the K-Message platform.

## Installation

```bash
npm install @k-msg/messaging @k-msg/core
# or  
bun add @k-msg/messaging @k-msg/core
```

## Features

- **DeliveryTracker**: Message delivery status tracking
- **Message Events**: Comprehensive event management for sent, delivered, and failed messages
- **Retry Logic**: Automatic retry for failed message deliveries
- **Bulk Processing**: Efficient handling of bulk message operations

## Basic Usage

```typescript
import { DeliveryTracker, MessageEventType } from '@k-msg/messaging';

const tracker = new DeliveryTracker({
  retryAttempts: 3,
  retryDelay: 1000
});

// Configure webhook URL
tracker.setWebhookUrl('https://your-app.com/webhook');

// Start tracking a message
await tracker.trackMessage({
  messageId: 'msg-123',
  phone: '01012345678',
  provider: 'iwinv',
  templateCode: 'TPL001',
  variables: { code: '123456' }
});

// Check message status
const status = await tracker.getMessageStatus('msg-123');
```

## Event Handling

```typescript
import { MessageEvent, MessageEventType } from '@k-msg/messaging';

// Register event listeners
tracker.on(MessageEventType.MESSAGE_SENT, (event: MessageEvent) => {
  console.log('Message sent:', event);
});

tracker.on(MessageEventType.MESSAGE_DELIVERED, (event: MessageEvent) => {
  console.log('Message delivered:', event);
});

tracker.on(MessageEventType.MESSAGE_FAILED, (event: MessageEvent) => {
  console.log('Message failed:', event);
});
```

## License

MIT