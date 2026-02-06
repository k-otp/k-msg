# @k-msg/messaging

K-Message 플랫폼의 메시징 및 발송 추적 시스템입니다.

## 설치

```bash
npm install @k-msg/messaging @k-msg/core
# or  
bun add @k-msg/messaging @k-msg/core
```

## 주요 기능

- **DeliveryTracker**: 메시지 발송 상태 추적
- **메시지 이벤트**: 발송, 전달, 실패 등 이벤트 관리
- **재시도 처리**: 실패한 메시지 재발송 로직
- **대량 발송**: 효율적인 벌크 메시지 처리

## 기본 사용법

```typescript
import { DeliveryTracker, MessageEventType } from '@k-msg/messaging';

const tracker = new DeliveryTracker({
  retryAttempts: 3,
  retryDelay: 1000
});

// 웹훅 URL 설정
tracker.setWebhookUrl('https://your-app.com/webhook');

// 메시지 추적 시작
await tracker.trackMessage({
  messageId: 'msg-123',
  phone: '01012345678',
  provider: 'iwinv',
  templateCode: 'TPL001',
  variables: { code: '123456' }
});

// 상태 조회
const status = await tracker.getMessageStatus('msg-123');
```

## 이벤트 처리

```typescript
import { MessageEvent, MessageEventType } from '@k-msg/messaging';

// 이벤트 리스너 등록
tracker.on(MessageEventType.MESSAGE_SENT, (event: MessageEvent) => {
  console.log('메시지가 발송되었습니다:', event);
});

tracker.on(MessageEventType.MESSAGE_DELIVERED, (event: MessageEvent) => {
  console.log('메시지가 전달되었습니다:', event);
});
```

## 라이센스

MIT