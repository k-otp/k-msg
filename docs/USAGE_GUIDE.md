# K-Message Usage Guide

K-Message는 다양한 사용 시나리오에 맞춰 **3가지 접근 방식**을 제공합니다. 복잡도와 기능에 따라 적절한 방법을 선택하세요.

## 📊 사용 방법 비교

| 방식 | 복잡도 | 기능 | 사용 시나리오 |
|------|--------|------|--------------|
| **간단한 핸들러** | ⭐ | 메시지 발송, 기본 템플릿 | CLI 스크립트, 간단한 봇 |
| **통합 서비스** | ⭐⭐⭐ | 데이터 로딩, 분석, 관리 | 웹 애플리케이션, 대시보드 |
| **로우레벨 API** | ⭐⭐ | 세밀한 제어, 커스텀 로직 | 고급 통합, 특수 요구사항 |

---

## 🚀 방법 1: 간단한 핸들러 (추천 ⭐)

**언제 사용?**
- 메시지만 간단히 보내고 싶을 때
- CLI 스크립트나 간단한 봇 개발
- 빠른 프로토타이핑

### 메시지 발송

```typescript
import { createKMsgSender } from 'k-msg/modules';

const sender = createKMsgSender({
  iwinvApiKey: process.env.IWINV_API_KEY!,
  iwinvBaseUrl: 'https://alimtalk.bizservice.iwinv.kr'
});

// 단일 메시지 발송
await sender.sendMessage('01012345678', 'OTP_TEMPLATE', { 
  code: '123456',
  serviceName: 'MyApp',
  expireMinutes: 3
});

// 대량 메시지 발송
await sender.sendBulk([
  { phoneNumber: '01011111111', variables: { name: '홍길동', code: '111111' } },
  { phoneNumber: '01022222222', variables: { name: '김철수', code: '222222' } }
], 'WELCOME_TEMPLATE', {
  batchSize: 10,
  batchDelay: 1000
});

// 메시지 상태 확인
const status = await sender.getStatus('msg_12345');
```

### 템플릿 관리

```typescript
import { createKMsgTemplates } from 'k-msg/modules';

const templates = createKMsgTemplates({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

// 템플릿 생성
await templates.create(
  'USER_WELCOME', 
  'Welcome #{name}! Your account #{accountId} is ready.',
  { category: 'NOTIFICATION' }
);

// 템플릿 검증
const validation = await templates.validate(
  'Hello #{name}, your code is #{code}'
);
console.log(validation.isValid, validation.variables);

// 템플릿 테스트
await templates.test('USER_WELCOME', { 
  name: '홍길동', 
  accountId: 'user_123' 
});
```

### 분석 데이터

```typescript
import { createKMsgAnalytics } from 'k-msg/modules';

const analytics = createKMsgAnalytics({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

// 메시지 통계
const stats = await analytics.getMessageStats('day');
console.log(`전송률: ${stats.deliveryRate}%`);

// 템플릿 사용량
const usage = await analytics.getTemplateUsage('OTP_TEMPLATE');
console.log(`성공률: ${usage.successRate}%`);

// 리포트 생성
const report = await analytics.generateReport('daily', 'json');
```

---

## 🏗️ 방법 2: 통합 서비스 (완전한 기능)

**언제 사용?**
- 웹 애플리케이션이나 대시보드 개발
- 채널과 템플릿을 자동으로 로드하고 관리
- 실시간 데이터와 분석이 필요한 경우

### 기본 사용법

```typescript
import { MessageServiceFactory } from 'k-msg';

// 🎯 가장 간단한 방법
const service = MessageServiceFactory.createIWINVService({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: process.env.IWINV_BASE_URL,
  debug: true,
  autoLoad: true // 자동으로 채널과 템플릿 로드
});

// 자동 로딩 완료 대기
await new Promise(resolve => setTimeout(resolve, 2000));

// 사용 가능한 데이터 확인
const templates = service.getTemplates('all');
const channels = service.getChannels();
const health = await service.healthCheck();

console.log(`템플릿 ${templates.templates?.length}개, 채널 ${channels.channels.length}개 로드됨`);
```

### 고급 설정

```typescript
import { MessageServiceFactory, IWINVProvider } from 'k-msg';

const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: process.env.IWINV_BASE_URL!,
  debug: true
});

const service = MessageServiceFactory.createService(provider, {
  debug: true,
  autoLoad: false, // 수동 로딩
  
  // 커스텀 핸들러로 예외사항 처리
  customHandlers: {
    templateLoader: async (provider) => {
      console.log('🔄 커스텀 템플릿 로더 실행...');
      const templates = await provider.templates.list();
      
      // IWINV 특화 후처리
      return templates.map(template => ({
        ...template,
        hasVariables: template.content.includes('#{'),
        variableCount: (template.content.match(/#{([^}]+)}/g) || []).length,
        isKorean: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(template.content)
      }));
    },
    
    errorHandler: (error, context) => {
      console.error(`🚨 [${context}] ${error.message}`);
      // 슬랙 알림, 로그 전송 등 커스텀 에러 처리
    }
  }
});

// 수동 로딩
await service.loadProviderData();
```

### 웹 서버와 통합

```typescript
import { Hono } from 'hono';
import { MessageServiceFactory } from 'k-msg';

const service = MessageServiceFactory.createIWINVService({
  apiKey: process.env.IWINV_API_KEY!,
  autoLoad: true
});

const app = new Hono();

// RESTful API 엔드포인트
app.get('/api/health', async (c) => {
  const health = await service.healthCheck();
  return c.json(health);
});

app.get('/api/templates', async (c) => {
  const source = c.req.query('source') as 'local' | 'provider' | 'all' || 'all';
  const result = service.getTemplates(source);
  return c.json(result);
});

app.post('/api/messages/send', async (c) => {
  const { phoneNumber, templateName, variables } = await c.req.json();
  const result = await service.sendMessage(phoneNumber, templateName, variables);
  return c.json(result);
});

// IWINV 특화 기능
app.get('/api/iwinv/balance', async (c) => {
  const result = await service.getIWINVBalance();
  return c.json(result);
});

export default { port: 3000, fetch: app.fetch };
```

---

## ⚙️ 방법 3: 로우레벨 API (세밀한 제어)

**언제 사용?**
- Provider별 특수 기능이 필요한 경우
- 커스텀 로직이나 복잡한 워크플로 구현
- 기존 시스템과의 깊은 통합

```typescript
import { IWINVProvider } from 'k-msg';

const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  debug: true
});

// 직접 Provider API 호출
const health = await provider.healthCheck();
const templates = await provider.templates.list();
const channels = await provider.channels.list();

// 메시지 발송
const result = await provider.sendMessage({
  templateCode: 'TEMPLATE_CODE',
  phoneNumber: '01012345678',
  variables: { code: '123456' }
});

// 템플릿 생성
await provider.createTemplate(
  'MY_TEMPLATE',
  'Hello #{name}!',
  'NOTIFICATION',
  [{ name: 'name', type: 'string', required: true }]
);

// IWINV 특화 기능
const balance = await provider.account.getBalance();
const analytics = await provider.analytics.getUsageStats({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31')
});
```

---

## 🤔 어떤 방법을 선택해야 할까?

### 🚀 간단한 핸들러 선택 기준:
- ✅ 메시지 발송만 필요
- ✅ CLI 도구나 스크립트 개발
- ✅ 빠른 프로토타이핑
- ✅ 최소한의 설정으로 시작

### 🏗️ 통합 서비스 선택 기준:
- ✅ 웹 애플리케이션 개발
- ✅ 실시간 데이터 관리 필요
- ✅ 관리 대시보드 구축
- ✅ 자동화된 데이터 로딩
- ✅ RESTful API 제공

### ⚙️ 로우레벨 API 선택 기준:
- ✅ Provider별 고유 기능 필요
- ✅ 복잡한 비즈니스 로직
- ✅ 기존 시스템과 깊은 통합
- ✅ 세밀한 제어 필요

---

## 📝 실제 사용 예시

### CLI 스크립트 (간단한 핸들러)
```bash
# send-otp.ts
import { createKMsgSender } from 'k-msg/modules';

const sender = createKMsgSender({ iwinvApiKey: process.env.IWINV_API_KEY! });
await sender.sendMessage(process.argv[2], 'OTP_TEMPLATE', { code: process.argv[3] });

# 실행
bun send-otp.ts 01012345678 123456
```

### Next.js API Route (통합 서비스)
```typescript
// pages/api/send-message.ts
import { MessageServiceFactory } from 'k-msg';

const service = MessageServiceFactory.createIWINVService({
  apiKey: process.env.IWINV_API_KEY!
});

export default async function handler(req, res) {
  const result = await service.sendMessage(
    req.body.phoneNumber,
    req.body.templateName,
    req.body.variables
  );
  res.json(result);
}
```

### 커스텀 통합 (로우레벨 API)
```typescript
// custom-messaging.ts
class CustomMessagingService {
  constructor(private provider: IWINVProvider) {}

  async sendWithFallback(phoneNumber: string, message: string) {
    try {
      // 알림톡 시도
      return await this.provider.sendMessage({ ... });
    } catch (error) {
      // SMS 폴백
      return await this.sendSMSFallback(phoneNumber, message);
    }
  }
}
```

---

## 🔧 Provider별 예외사항 처리

K-Message는 Provider별 특수 요구사항을 다음과 같이 처리합니다:

### 1. 커스텀 핸들러 (통합 서비스)
```typescript
{
  customHandlers: {
    templateLoader: async (provider) => {
      // IWINV 특화: 채널 API가 없으면 기본 채널 사용
      // KakaoBusiness 특화: 비즈니스 인증 상태 확인
      // Naver 특화: SMS/알림톡 분리 로직
    }
  }
}
```

### 2. Provider별 구체 클래스
```typescript
// IWINVMessageService: IWINV 특화 구현
// KakaoBusinessMessageService: 카카오 특화 구현  
// NaverMessageService: 네이버 특화 구현
```

### 3. 팩토리 패턴
```typescript
// Provider ID 자동 감지하여 적절한 서비스 선택
MessageServiceFactory.createService(provider) // 자동 선택
```

이렇게 3가지 방식으로 다양한 사용 시나리오를 모두 커버할 수 있습니다! 🎯