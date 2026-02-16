# @k-msg/template

K-Message 플랫폼의 템플릿 관리 및 검증 패키지입니다.

## 설치

```bash
npm install @k-msg/template @k-msg/core
# or
bun add @k-msg/template @k-msg/core
```

## 주요 기능

- **Template Engine**: 템플릿 종합 관리 시스템
- **Variable Parsing**: 템플릿 변수 자동 추출 및 검증
- **Template Validation**: 템플릿 내용/구조 내장 검증
- **Template Registry**: 템플릿 중앙 저장/조회
- **Template Builder**: 템플릿 동적 생성/수정

## 기본 사용법

```typescript
import { interpolate } from '@k-msg/template';

const text = interpolate('[MyApp] Your verification code is #{code}.', {
  code: '123456',
});

console.log(text); // "[MyApp] Your verification code is 123456."
```

## Template Registry

```typescript
import { TemplateRegistry } from '@k-msg/template';

const registry = new TemplateRegistry();

// 템플릿 등록
await registry.register({
  id: 'otp-basic',
  name: 'Basic OTP Template',
  content: '[#{service}] Verification code: #{code}',
  category: 'AUTHENTICATION'
});

// 템플릿 검색
const templates = await registry.search({
  category: 'AUTHENTICATION',
  status: 'ACTIVE'
});
```

## Provider-backed TemplateService (선택)

`TemplateService`는 `@k-msg/core`의 `TemplateProvider` 인터페이스를 감싸는 작은 helper입니다.

```typescript
import { TemplateService } from '@k-msg/template';
import type { TemplateProvider } from '@k-msg/core';

const provider: TemplateProvider = /* your implementation */;
const templateService = new TemplateService(provider);

await templateService.create({
  code: 'OTP_001',
  name: 'OTP Verification',
  content: '[MyApp] Your verification code is #{code}.',
  category: 'AUTHENTICATION'
});
```

## 라이선스

MIT
