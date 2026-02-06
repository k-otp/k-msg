# @k-msg/webhook-system

실시간 메시지 이벤트 알림을 위한 엔터프라이즈급 Webhook 시스템입니다.

## ✨ 주요 기능

- 🚀 **비동기 이벤트 디스패칭**: 고성능 병렬 웹훅 전송
- 🔄 **스마트 재시도**: 지수 백오프와 지터를 사용한 재시도 로직
- 🔒 **보안**: HMAC 서명 및 타임스탬프 검증
- 📊 **모니터링**: 전송 통계 및 실패 추적
- 🎯 **필터링**: 이벤트 타입 및 메타데이터 기반 필터링
- 📦 **배치 처리**: 대량 이벤트 효율적 처리

## 📦 설치

```bash
npm install @k-msg/webhook-system
# 또는
bun add @k-msg/webhook-system
```

## 🚀 빠른 시작

### 1. 기본 설정

```typescript
import { 
  WebhookService, 
  WebhookRegistry, 
  WebhookDispatcher,
  SecurityManager,
  RetryManager,
  WebhookEventType 
} from '@k-msg/webhook-system';

// 웹훅 시스템 초기화
const registry = new WebhookRegistry();
const securityManager = new SecurityManager();
const retryManager = new RetryManager();
const dispatcher = new WebhookDispatcher(registry, securityManager, retryManager);

const webhookService = new WebhookService({
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
  enableSecurity: true,
  secretKey: 'your-webhook-secret',
  enabledEvents: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_DELIVERED,
    WebhookEventType.TEMPLATE_APPROVED
  ],
  batchSize: 10,
  batchTimeoutMs: 5000
});
```

### 2. 웹훅 엔드포인트 등록

```typescript
const endpoint = {
  id: 'endpoint-1',
  url: 'https://your-app.com/webhooks',
  name: 'My App Webhook',
  description: 'Receives message events',
  active: true,
  events: [
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_DELIVERED,
    WebhookEventType.MESSAGE_FAILED
  ],
  secret: 'your-endpoint-secret',
  retryConfig: {
    maxRetries: 5,
    retryDelayMs: 2000,
    backoffMultiplier: 2
  },
  filters: {
    providerId: ['iwinv', 'aligo'],
    channelId: ['channel-1']
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'active' as const
};

await webhookService.registerEndpoint(endpoint);
```

### 3. 이벤트 발송

```typescript
// 단일 이벤트 발송
const event = {
  id: 'evt_123',
  type: WebhookEventType.MESSAGE_SENT,
  timestamp: new Date(),
  data: {
    messageId: 'msg_456',
    templateId: 'tmpl_789',
    phoneNumber: '01012345678',
    status: 'sent'
  },
  metadata: {
    providerId: 'iwinv',
    channelId: 'channel-1',
    templateId: 'tmpl_789',
    messageId: 'msg_456',
    correlationId: 'req_abc'
  },
  version: '1.0'
};

await webhookService.dispatchEvent(event);

// 배치 이벤트 발송
const events = [event1, event2, event3];
await webhookService.dispatchEvents(events);
```

## 📋 이벤트 타입

웹훅 시스템은 다음과 같은 이벤트 타입을 지원합니다:

### 메시지 이벤트

- `message.sent` - 메시지 발송 완료
- `message.delivered` - 메시지 전달 완료
- `message.failed` - 메시지 발송 실패
- `message.clicked` - 메시지 클릭
- `message.read` - 메시지 읽음

### 템플릿 이벤트

- `template.created` - 템플릿 생성
- `template.approved` - 템플릿 승인
- `template.rejected` - 템플릿 거부
- `template.updated` - 템플릿 수정
- `template.deleted` - 템플릿 삭제

### 채널 이벤트

- `channel.created` - 채널 생성
- `channel.verified` - 채널 인증
- `sender_number.added` - 발신번호 추가
- `sender_number.verified` - 발신번호 인증

### 시스템 이벤트

- `system.quota_warning` - 할당량 경고
- `system.quota_exceeded` - 할당량 초과
- `system.provider_error` - 프로바이더 오류
- `system.maintenance` - 시스템 점검

### 분석 이벤트

- `analytics.anomaly_detected` - 이상 징후 감지
- `analytics.threshold_exceeded` - 임계값 초과

## 🔒 보안

### HMAC 서명 검증

웹훅 요청은 HMAC-SHA256으로 서명됩니다:

```typescript
// 서명 생성 (자동)
const securityManager = new SecurityManager({
  algorithm: 'sha256',
  header: 'X-Webhook-Signature',
  prefix: 'sha256='
});

// 수신측에서 서명 검증
const payload = req.body;
const signature = req.headers['X-Webhook-Signature'];
const secret = process.env.WEBHOOK_SECRET;

const isValid = securityManager.verifySignature(payload, signature, secret);
if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### 타임스탬프 검증

재생 공격을 방지하기 위한 타임스탬프 검증:

```typescript
const timestamp = req.headers['X-Webhook-Timestamp'];
const isValidTime = securityManager.verifyTimestamp(timestamp, 300); // 5분 허용

if (!isValidTime) {
  return res.status(401).json({ error: 'Request too old' });
}
```

## 🔄 재시도 정책

### 설정

```typescript
const retryManager = new RetryManager({
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 300000, // 5분
  backoffMultiplier: 2,
  jitter: true
});
```

### 재시도 조건

- **네트워크 오류**: 연결 실패, 타임아웃 등
- **5xx 서버 오류**: 일시적 서버 문제
- **429 Too Many Requests**: 요청 제한
- **408 Request Timeout**: 요청 타임아웃

### 재시도하지 않는 조건

- **4xx 클라이언트 오류** (429, 408 제외)
- **최대 재시도 횟수 초과**
- **성공적 응답** (2xx, 3xx)

## 📊 모니터링 및 통계

### 웹훅 통계 조회

```typescript
// 전체 통계
const stats = await webhookService.getStats();
console.log(stats);
// {
//   totalEndpoints: 5,
//   activeEndpoints: 4,
//   totalDeliveries: 1250,
//   successfulDeliveries: 1180,
//   failedDeliveries: 70,
//   averageLatency: 245,
//   successRate: 94.4
// }

// 특정 엔드포인트 통계
const endpointStats = await webhookService.getEndpointStats('endpoint-1', {
  start: new Date('2024-01-01'),
  end: new Date('2024-01-31')
});
```

### 실패한 전송 조회

```typescript
// 실패한 전송 내역
const failedDeliveries = await webhookService.getFailedDeliveries('endpoint-1');

failedDeliveries.forEach(delivery => {
  console.log(`Delivery ${delivery.id} failed:`, delivery.attempts[0].error);
});
```

## 🎯 고급 기능

### 이벤트 필터링

엔드포인트별로 세밀한 이벤트 필터링 가능:

```typescript
const endpoint = {
  id: 'filtered-endpoint',
  url: 'https://app.com/webhooks',
  events: [WebhookEventType.MESSAGE_SENT],
  filters: {
    providerId: ['iwinv'],           // IWINV 프로바이더만
    channelId: ['channel-marketing'], // 마케팅 채널만
    templateId: ['welcome-template']  // 환영 템플릿만
  },
  // ... 기타 설정
};
```

### 배치 처리

대량 이벤트를 효율적으로 처리:

```typescript
const webhookService = new WebhookService({
  batchSize: 50,
  batchTimeoutMs: 10000, // 10초마다 또는 50개씩 배치 처리
  // ... 기타 설정
});

// 배치가 자동으로 처리됨
await webhookService.dispatchEvent(event1);
await webhookService.dispatchEvent(event2);
// ... 더 많은 이벤트
```

### 엔드포인트 테스트

웹훅 엔드포인트의 연결성 테스트:

```typescript
const testResult = await webhookService.testEndpoint('endpoint-1');

if (testResult.success) {
  console.log(`✅ Endpoint is healthy (${testResult.responseTime}ms)`);
} else {
  console.log(`❌ Endpoint failed: ${testResult.error}`);
}
```

## 🛠️ Express/Hono와 통합

### Express 미들웨어

```typescript
import express from 'express';

const app = express();

// 웹훅 검증 미들웨어
const verifyWebhook = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!securityManager.verifySignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};

app.post('/webhooks', verifyWebhook, (req, res) => {
  const event = req.body;
  
  console.log(`Received ${event.type} event:`, event.data);
  
  // TODO: 이벤트 처리 로직
  
  res.json({ success: true });
});
```

### Hono 통합

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.post('/webhooks', async (c) => {
  const signature = c.req.header('X-Webhook-Signature');
  const payload = await c.req.text();
  
  if (!securityManager.verifySignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }
  
  const event = JSON.parse(payload);
  
  // TODO: 이벤트 처리
  console.log(`Processing ${event.type}:`, event.data);
  
  return c.json({ success: true });
});
```

## 🔧 설정 옵션

### WebhookConfig

```typescript
interface WebhookConfig {
  maxRetries: number;        // 최대 재시도 횟수 (기본: 3)
  retryDelayMs: number;      // 재시도 기본 지연시간 (기본: 1000ms)
  timeoutMs: number;         // 요청 타임아웃 (기본: 30000ms)
  enableSecurity: boolean;   // 보안 기능 활성화 (기본: true)
  secretKey?: string;        // 기본 시크릿 키
  enabledEvents: WebhookEventType[]; // 활성화할 이벤트 타입들
  batchSize: number;         // 배치 크기 (기본: 10)
  batchTimeoutMs: number;    // 배치 타임아웃 (기본: 5000ms)
}
```

### RetryConfig

```typescript
interface RetryConfig {
  maxRetries: number;        // 최대 재시도 횟수
  baseDelayMs: number;       // 기본 지연시간
  maxDelayMs: number;        // 최대 지연시간
  backoffMultiplier: number; // 백오프 배수
  jitter: boolean;           // 지터 활성화 (랜덤성 추가)
}
```

## 📝 예제

전체 예제는 [examples](./examples/) 디렉토리를 참조하세요:

- [기본 사용법](./examples/basic-usage.ts)
- [Express 통합](./examples/express-integration.ts)
- [대량 처리](./examples/batch-processing.ts)
- [고급 필터링](./examples/advanced-filtering.ts)

## 🤝 기여하기

기여를 환영합니다! [CONTRIBUTING.md](../../CONTRIBUTING.md)를 참조하세요.

## 📄 라이선스

MIT License - [LICENSE](../../LICENSE) 파일을 참조하세요.

---

**K-Message** - 한국형 멀티채널 메시징 플랫폼

🌟 [GitHub](https://github.com/imjlk/k-msg) | 📖 [Documentation](https://k-msg.dev) | 💬 [Discord](https://discord.gg/k-msg)
