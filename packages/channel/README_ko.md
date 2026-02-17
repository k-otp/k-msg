# @k-msg/channel

K-Message 플랫폼의 채널 및 발신번호 관리 패키지입니다.

## 설치

```bash
npm install @k-msg/channel @k-msg/core
# or
bun add @k-msg/channel @k-msg/core
```

## 주요 기능

- **채널 관리**: 채널 라이프사이클 전체 관리
- **발신번호 등록**: 발신번호 등록 및 검증 자동화
- **사업자 검증**: 알림톡 채널용 사업자 정보 검증
- **권한 관리**: 채널 대상 역할 기반 접근 제어
- **상태 모니터링**: 채널 상태 실시간 모니터링

## 런타임 호환성

- 런타임에서 Node 내장 모듈에 의존하지 않아 Edge 환경에서 `nodejs_compat` 없이 동작합니다.

## 기본 사용법

```typescript
import { ChannelService } from '@k-msg/channel';

const channelService = new ChannelService();

// 새 알림톡 채널 생성
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

// 발신번호 등록
const senderNumber = await channelService.addSenderNumber(channel.id, {
  phoneNumber: '15881234',
  purpose: 'MARKETING'
});
```

## 채널 검증

```typescript
// 사업자 정보 검증
const verification = await channelService.verifyBusiness(channel.id, {
  documents: [
    { type: 'BUSINESS_LICENSE', url: 'https://docs.example.com/license.pdf' },
    { type: 'REPRESENTATIVE_ID', url: 'https://docs.example.com/id.pdf' }
  ]
});

// 검증 상태 확인
const status = await channelService.getVerificationStatus(channel.id);
console.log('Verification status:', status);
```

## 발신번호 관리

```typescript
// 채널의 모든 발신번호 조회
const senderNumbers = await channelService.getSenderNumbers(channel.id);

// SMS 인증으로 발신번호 검증
await channelService.verifySenderNumber(senderNumber.id, '123456');

// 발신번호 상태 확인
const numberStatus = await channelService.getSenderNumberStatus(senderNumber.id);
```

## 라이선스

MIT
