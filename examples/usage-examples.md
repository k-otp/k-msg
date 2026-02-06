# K-Message 사용 예시들

## 1. 완전한 관리자 대시보드 (3줄로 완성)

```typescript
// app.ts
import { createAdminDashboard } from '@k-msg/admin';

export default createAdminDashboard({
  iwinvApiKey: process.env.IWINV_API_KEY!,
  port: 3000,
  features: {
    templates: true,
    messages: true,
    analytics: true
  }
});
```

## 2. 커스텀 관리자 앱 (세부 제어)

```typescript
// custom-admin.ts
import { createApp } from 'honox/server';
import { KMessagePlatform, createAdminRoutes } from '@k-msg/core';

const platform = new KMessagePlatform({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

const app = createApp();
const routes = createAdminRoutes(platform, {
  templates: true,
  messages: true,
  channels: true
});

// 필요한 것만 마운트
app.route('/api/templates', routes.templates);
app.route('/api/messages', routes.messages);

// 커스텀 라우트 추가
app.get('/api/custom', (c) => {
  return c.json({ message: 'Custom endpoint' });
});

export default app;
```

## 3. CLI 툴용 메시지 발송

```typescript
// send-messages.ts
import { createKMsgSender } from '@k-msg/modules';

const sender = createKMsgSender({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

// 사용자 정의 OTP 템플릿으로 발송
await sender.sendMessage('01012345678', 'MY_OTP_TEMPLATE', {
  code: '123456',
  serviceName: 'MyApp',
  expireMinutes: 3
});

// 주문 확인 메시지
await sender.sendMessage('01012345678', 'ORDER_CONFIRM_TEMPLATE', {
  customerName: '홍길동',
  orderNumber: 'ORD-20240108-001',
  amount: 25000,
  deliveryDate: '2024-01-10'
});

// 대량 발송 (각자 다른 변수)
await sender.sendBulk([
  { 
    phoneNumber: '01012345678', 
    variables: { 
      customerName: '홍길동', 
      code: '123456',
      expireTime: '15분'
    } 
  },
  { 
    phoneNumber: '01087654321', 
    variables: { 
      customerName: '김영희', 
      code: '789012',
      expireTime: '15분'
    } 
  }
], 'USER_VERIFICATION_TEMPLATE');
```

## 4. Plugin 기반 확장형 관리자

```typescript
// plugin-admin.ts
import { KMessagePlatform, AdminBuilder, TemplatePlugin, MessagePlugin, AnalyticsPlugin } from '@k-msg/admin';

const platform = new KMessagePlatform({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

const app = new AdminBuilder(platform)
  .use(TemplatePlugin)
  .use(MessagePlugin)
  .use(AnalyticsPlugin)
  .use(MyCustomPlugin)  // 커스텀 플러그인도 추가 가능
  .build();

export default app;
```

## 5. 템플릿 관리 스크립트

```typescript
// template-management.ts
import { createKMsgTemplates } from '@k-msg/modules';

const templates = createKMsgTemplates({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

// 사용자 정의 템플릿 생성
await templates.create('USER_WELCOME_TEMPLATE', 
  'Welcome to #{serviceName}, #{customerName}! Your account #{accountId} is ready.',
  {
    category: 'USER_ONBOARDING',
    description: 'New user welcome message with service and account info'
  }
);

// 주문 확인 템플릿
await templates.create('ORDER_CONFIRM_TEMPLATE',
  '#{customerName}님, 주문번호 #{orderNumber}의 결제 #{amount}원이 완료되었습니다. #{deliveryDate}에 배송예정입니다.',
  {
    category: 'ORDER_MANAGEMENT',
    description: 'Order confirmation with delivery info'
  }
);

// 템플릿 검증 및 변수 추출
const validation = await templates.validate(
  'Hello #{customerName}, your order #{orderNumber} totaling #{amount} is ready for pickup!'
);
console.log(validation);
// {
//   isValid: true,
//   errors: [],
//   variables: [
//     { name: 'customerName', type: 'string', required: true },
//     { name: 'orderNumber', type: 'string', required: true },
//     { name: 'amount', type: 'string', required: true }
//   ]
// }

// 템플릿 테스트
await templates.test('USER_WELCOME_TEMPLATE', {
  serviceName: 'MyShop',
  customerName: '홍길동',
  accountId: 'ACC-2024-001'
});
```

## 6. 분석/리포팅 스크립트

```typescript
// analytics-report.ts
import { createKMsgAnalytics } from '@k-msg/modules';

const analytics = createKMsgAnalytics({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

// 일일 통계
const stats = await analytics.getMessageStats('day');
console.log(`Today: ${stats.sent} sent, ${stats.delivered} delivered`);

// 주간 리포트 생성
const report = await analytics.generateReport('weekly', 'csv');
await fs.writeFileSync('weekly-report.csv', report);
```

## 7. Express.js와 통합

```typescript
// express-integration.ts
import express from 'express';
import { KMessagePlatform, AdminRouteBuilder } from '@k-msg/core';

const app = express();
const platform = new KMessagePlatform({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

const builder = new AdminRouteBuilder(platform);

// Express에 K-Message API 라우트 마운트
app.use('/api/templates', builder.templates());
app.use('/api/messages', builder.messages());
app.use('/api/analytics', builder.analytics());

app.listen(3000);
```

## 8. Next.js API 라우트와 통합

```typescript
// pages/api/templates.ts
import { KMessagePlatform } from '@k-msg/core';
import { createAdminRoutes } from '@k-msg/admin';

const platform = new KMessagePlatform({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

const routes = createAdminRoutes(platform);

export default routes.templates;
```

## 9. 간단한 알림 서비스

```typescript
// notification-service.ts
import { createKMsgSender } from '@k-msg/modules';

const sender = createKMsgSender({
  iwinvApiKey: process.env.IWINV_API_KEY!
});

class NotificationService {
  async sendWelcome(phoneNumber: string, customerName: string, serviceName: string) {
    return sender.sendMessage(phoneNumber, 'USER_WELCOME_TEMPLATE', { 
      customerName, 
      serviceName,
      registrationDate: new Date().toLocaleDateString('ko-KR')
    });
  }

  async sendOrderConfirm(phoneNumber: string, customerName: string, orderNumber: string, amount: number) {
    return sender.sendMessage(phoneNumber, 'ORDER_CONFIRM_TEMPLATE', { 
      customerName,
      orderNumber, 
      amount: amount.toLocaleString('ko-KR'),
      estimatedDelivery: '1-2일'
    });
  }

  async sendVerificationCode(phoneNumber: string, code: string, serviceName: string, expireMinutes = 5) {
    return sender.sendMessage(phoneNumber, 'VERIFICATION_CODE_TEMPLATE', {
      code,
      serviceName,
      expireMinutes
    });
  }

  async sendShippingUpdate(phoneNumber: string, customerName: string, trackingNumber: string, status: string) {
    return sender.sendMessage(phoneNumber, 'SHIPPING_UPDATE_TEMPLATE', {
      customerName,
      trackingNumber,
      status,
      updateTime: new Date().toLocaleString('ko-KR')
    });
  }
}

export const notifications = new NotificationService();
```

## 10. Docker로 배포 가능한 관리자 서비스

```typescript
// Dockerfile에서 사용할 수 있는 standalone 서비스
import { createQuickAdmin } from '@k-msg/admin';

const admin = createQuickAdmin(
  process.env.IWINV_API_KEY!,
  parseInt(process.env.PORT || '3000')
);

admin.start();
```