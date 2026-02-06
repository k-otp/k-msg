# K-Message Platform

🏃‍♂️ **[Bun](https://bun.sh)으로 구동됩니다** - 올인원 JavaScript 런타임

한국형 멀티채널 메시징 플랫폼 - 알림톡, 친구톡, SMS, LMS 통합 솔루션

알림톡부터 문자메시지까지, 다양한 메시징 채널을 통합 관리하는 오픈소스 플랫폼입니다.

## 🚀 왜 Bun인가요?

이 프로젝트는 최고의 성능과 개발자 경험을 위해 **Bun**으로 구축되었습니다:

- ⚡ **초고속**: 대부분의 작업에서 Node.js보다 최대 4배 빠름
- 🔧 **올인원**: 런타임, 번들러, 테스트 러너, 패키지 매니저가 하나의 도구에
- 🎯 **제로 설정**: webpack, babel 등 복잡한 빌드 설정이 필요 없음
- 📦 **네이티브 TypeScript**: `.ts` 파일을 컴파일 없이 바로 실행
- 🌐 **내장 Web API**: WebSocket, fetch 등 최신 API를 기본 제공
- 🧪 **빠른 테스팅**: Jest 호환 API를 가진 내장 테스트 러너

## ✨ 주요 기능

- 🔌 **멀티 프로바이더 지원**: IWINV, Kakao, NHN 등 다양한 업체 지원
- 📱 **다채널 메시징**: 알림톡, 친구톡, SMS, LMS, MMS 통합
- 🎨 **템플릿 엔진**: 강력한 변수 치환 및 템플릿 관리
- ⚡ **대량 발송**: 효율적인 배치 처리 및 큐 시스템
- 📊 **실시간 모니터링**: 발송 현황 및 성공률 추적
- 🛠️ **CLI 도구**: 개발자 친화적인 명령행 인터페이스
- 🌐 **웹 대시보드**: 직관적인 관리 인터페이스

## 🏗️ 아키텍처

```
k-message-platform/
├── packages/                          # 핵심 패키지들
│   ├── provider-core/                 # 프로바이더 코어 인터페이스
│   ├── messaging-core/                # 메시징 엔진 & 큐 시스템
│   ├── template-engine/               # 템플릿 파싱 & 변수 치환
│   ├── channel-manager/               # 채널 & 발신번호 관리
│   ├── provider-interface/            # 프로바이더 추상화 계층
│   ├── analytics-engine/              # 통계 & 분석 엔진
│   ├── webhook-system/                # 실시간 이벤트 알림
│   └── provider-plugins/              # 프로바이더 플러그인
│       └── iwinv/                     # IWINV 프로바이더
└── apps/                              # 애플리케이션
    ├── cli/                           # CLI 도구
    └── admin-dashboard/               # 웹 대시보드
```

## 🚀 빠른 시작

### 1. 설치

**Bun 사용 (권장)**:
```bash
bun add k-msg
```

**npm 사용**:
```bash
npm install k-msg
```

### 2. 환경 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# IWINV Provider Configuration  
IWINV_API_KEY=your-iwinv-api-key
IWINV_BASE_URL=https://biz.service.iwinv.kr

# Platform Configuration
PLATFORM_ENV=development
PLATFORM_DEBUG=true
```

### 3. 실행 (빌드 없이 바로 테스트 가능)

```bash
# CLI 헬스 체크
cd core/apps/cli && bun src/cli.ts health

# 웹 대시보드 실행
cd core/apps/admin-dashboard && bun src/index.ts

# 기본 예제 실행
cd examples/basic-usage && bun src/index.ts
```

### 4. 기본 사용법

```typescript
import { AlimTalkPlatform, TemplateCategory } from '@k-msg/core';
import { IWINVProvider } from '@k-msg/provider';

// 플랫폼 초기화
const platform = new AlimTalkPlatform({
  providers: ['iwinv'],
  features: {
    enableBulkSending: true,
    enableScheduling: true,
    enableAnalytics: true
  }
});

// IWINV 프로바이더 등록 (환경변수 자동 사용)
const iwinvProvider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY, // .env에서 자동 로드
  baseUrl: process.env.IWINV_BASE_URL || 'https://biz.service.iwinv.kr',
  debug: true
});

platform.registerProvider(iwinvProvider);

// 템플릿 등록
const template = await platform.templates.register({
  name: 'welcome_message',
  content: '[#{서비스명}] 안녕하세요, #{고객명}님!',
  category: TemplateCategory.NOTIFICATION,
  variables: [
    { name: '서비스명', type: 'string', required: true },
    { name: '고객명', type: 'string', required: true }
  ]
});

// 메시지 발송
const result = await platform.messages.send({
  templateId: template.id,
  recipients: [{ phoneNumber: '01012345678' }],
  variables: {
    '서비스명': 'MyApp',
    '고객명': '홍길동'
  }
});
```

## 📱 애플리케이션

### CLI 도구

```bash
# 환경변수 설정 후 CLI 실행
cd core/apps/cli
export IWINV_API_KEY=your-api-key

# 헬스 체크
bun src/cli.ts health

# 플랫폼 정보 확인
bun src/cli.ts info

# IWINV 템플릿 생성 테스트
bun src/cli.ts test-template -n "welcome" -c "[#{서비스명}] 환영합니다!"

# IWINV 메시지 발송 테스트  
bun src/cli.ts test-send -t "template_code" -p "01012345678" -v '{"서비스명":"MyApp"}'

# 대화형 설정
bun src/cli.ts setup
```

### 웹 대시보드

```bash
# 대시보드 실행
cd core/apps/admin-dashboard
IWINV_API_KEY=your-api-key bun src/index.ts

# 브라우저에서 http://localhost:3000 접속
```

**웹 대시보드 기능:**

- 🏥 실시간 시스템 헬스 모니터링
- 🔌 프로바이더 상태 확인
- 📝 템플릿 관리 (생성, 조회)
- 📤 메시지 발송 테스트
- 📊 플랫폼 정보 및 통계

### K-OTP 서비스

```bash
# K-OTP 서비스 실행
cd commercial/k-otp
bun run start
```

## 🔌 프로바이더

### IWINV 프로바이더

```typescript
import { IWINVProvider } from '@k-msg/provider';

const provider = new IWINVProvider({
  apiKey: 'your-iwinv-api-key',
  baseUrl: 'https://biz.service.iwinv.kr',
  timeout: 30000,
  retries: 3,
  debug: false
});

// 기능
- ✅ 메시지 발송
- ✅ 대량 발송
- ✅ 예약 발송
- ✅ 템플릿 관리
- ✅ 발송 내역 조회
- ✅ 잔액 조회
```

## ✅ 패키지 완성도

모든 패키지가 100% 완성되었으며, 통합 테스트를 통과했습니다:

- ✅ **@k-msg/core** (100%) - 프로바이더 추상화 계층
- ✅ **@k-msg/provider** (100%) - IWINV 구현체를 포함한 완전한 프로바이더 시스템
- ✅ **@k-msg/template** (100%) - 템플릿 관리 및 변수 치환
- ✅ **@k-msg/messaging** (100%) - 메시지 전송 및 큐 시스템  
- ✅ **@k-msg/channel** (100%) - 채널 및 발신번호 관리
- ✅ **@k-msg/analytics** (100%) - 실시간 분석 및 리포팅
- ✅ **@k-msg/webhook** (100%) - 이벤트 기반 웹훅 처리
- ✅ **통합 테스트** (완료) - 패키지간 연동 검증

### 통합 테스트 결과

```bash
bun test integration-simple.test.ts

✅ Cross-package integration test completed successfully!
📝 Template created: Flow Test Template
📊 Analytics queries executed
🔗 Webhook events processed

4 pass, 0 fail, 13 expect() calls
```

## 📚 핵심 패키지

### @k-msg/templates

템플릿 관리를 위한 핵심 엔진

```typescript
import { VariableParser, TemplateValidator } from '@k-msg/templates';

// 변수 추출
const variables = VariableParser.extractVariables('[#{이름}]님 안녕하세요!');
// ['이름']

// 변수 치환
const content = VariableParser.replaceVariables(
  '[#{이름}]님 안녕하세요!',
  { 이름: '홍길동' }
);
// '홍길동님 안녕하세요!'

// 템플릿 검증
const validation = TemplateValidator.validateTemplate(template);
```

### @k-msg/messaging

메시지 발송을 위한 핵심 시스템

```typescript
import { SingleMessageSender, BulkMessageSender } from '@k-msg/messaging';

const sender = new SingleMessageSender();
const bulkSender = new BulkMessageSender(sender);

// 단일 발송
const result = await sender.send(messageRequest);

// 대량 발송
const bulkResult = await bulkSender.sendBulk(bulkRequest);
```

### @k-msg/channels

채널 및 발신번호 관리

```typescript
import { KakaoChannelManager } from '@k-msg/channels';

const channelManager = new KakaoChannelManager();

// 채널 생성
const channel = await channelManager.createChannel(channelRequest);

// 발신번호 추가
const senderNumber = await channelManager.addSenderNumber(channelId, number);
```

### @k-msg/core

프로바이더 통합을 위한 핵심 인터페이스

```typescript
import { BaseAlimTalkProvider } from '@k-msg/core';

class MyProvider extends BaseAlimTalkProvider {
  readonly id = 'my-provider';
  readonly name = 'My Provider';
  
  // 인터페이스 구현...
}
```

## 🛠️ 개발

### Bun 기반 개발 경험

- 🔥 **핫 모듈 리로딩**: `bun --hot`으로 즉시 피드백
- 📦 **패키지 관리**: 고급 패키지 작업을 위한 `bun pm` 사용
- 🚀 **제로 설정 번들링**: TypeScript, JSX 등을 기본 지원
- ⚡ **빠른 설치**: npm보다 25배 빠른 의존성 설치

### 개발 명령어

```bash
# 핫 리로딩으로 개발 서버 시작
bun --hot src/index.ts

# 환경변수와 함께 실행
bun --env-file=.env src/index.ts

# TypeScript 직접 실행 (컴파일 단계 없음)
bun run src/my-script.ts

# 패키지 관리
bun pm pack          # tarball 생성
bun pm ls           # 의존성 목록
bun pm cache rm     # 캐시 정리
```

### 필수 조건

**Bun 설치** (아직 설치하지 않았다면):
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 환경 설정

```bash
# 의존성 설치 (Bun으로 초고속!)
bun install

# 환경변수 설정
export IWINV_API_KEY="your-iwinv-api-key"
export IWINV_BASE_URL="https://biz.service.iwinv.kr"
```

### 예제 실행

```bash
# 기본 사용법 예제
cd examples/basic-usage
IWINV_API_KEY=your-api-key bun src/index.ts
```

**예제 포함 기능:**

- ✅ 플랫폼 초기화 및 프로바이더 등록
- ✅ 헬스 체크 및 연결 테스트
- ✅ 템플릿 등록 및 변수 파싱
- ✅ 메시지 발송 시뮬레이션
- ✅ K-OTP 서비스 연동 예제

### 테스트

```bash
# 전체 테스트 (Bun 내장 테스트 러너)
bun test

# 개별 패키지 테스트
cd packages/template && bun test

# 워치 모드
bun test --watch

# 커버리지 리포트
bun test --coverage
```

## 📊 수익 모델

### 오픈소스 (AlimTalk Platform)

- ✅ 무료 사용
- ✅ 커뮤니티 지원
- ✅ 플러그인 생태계

### 상업용 (K-OTP 등)

- 💰 사용량 기반 과금
- 🎯 전문 기능
- 🔧 전문 지원

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 링크

- [아키텍처 문서](./ARCHITECTURE.md)
- [API 문서](./docs/api.md)
- [프로바이더 가이드](./docs/providers.md)
- [기여 가이드](./CONTRIBUTING.md)

## 🔧 기술 스택

- **런타임**: [Bun](https://bun.sh) - 올인원 JavaScript 런타임
- **언어**: 네이티브 지원하는 TypeScript
- **테스팅**: Bun 내장 테스트 러너
- **번들링**: Bun 네이티브 번들러 (webpack 불필요)
- **패키지 매니저**: Bun의 초고속 패키지 매니저

## ⚠️ Bun Build 알려진 문제점

### CommonJS 익스포트 문제

Bun은 뛰어난 성능과 개발자 경험을 제공하지만, CommonJS (CJS) 빌드 출력에 몇 가지 알려진 문제가 있습니다:

#### 1. **명명된 익스포트 변환 문제** ([#12463](https://github.com/oven-sh/bun/issues/12463))
- 빌드된 CJS 모듈이 원본과 동일하게 명명된 임포트를 지원하지 못할 수 있음
- **해결책**: 기본 임포트와 구조 분해 사용:
  ```typescript
  // 대신: import { namedExport } from 'module'
  import pkg from 'module';
  const { namedExport } = pkg;
  ```

#### 2. **ESM/CJS 상호 운용성 예외 상황** ([#5654](https://github.com/oven-sh/bun/issues/5654))
- `__esModule: true`와 함께 CJS 코드를 임포트할 때 참조 오류 발생
- **해결책**: 네임스페이스 임포트 사용:
  ```typescript
  import * as module from 'module';
  module.namedExport();
  ```

#### 3. **이상한 CJS 출력 동작** ([#14532](https://github.com/oven-sh/bun/issues/14532))
- 일부 CJS 빌드 시나리오에서 코드가 두 번 실행될 수 있음
- **해결책**: 가능할 때 ESM 포맷 사용:
  ```bash
  bun build --format esm  # --format cjs 대신
  ```

### 우리의 현재 해결책

이 프로젝트는 신중한 의존성 관리와 함께 **듀얼 모듈 포맷** (ESM + CJS)을 사용합니다:

```json
{
  "main": "./dist/index.js",     // Node.js 호환성을 위한 CJS
  "module": "./dist/index.mjs",  // 현대적 번들러를 위한 ESM
  "types": "./dist/index.d.ts",  // TypeScript 정의
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

이러한 문제들은 Bun 팀에서 적극적으로 해결하고 있으며, 대부분의 사용 사례에서 Bun 사용의 이점이 이러한 일시적 한계보다 여전히 더 큽니다.

## 📞 지원

- GitHub Issues: 버그 리포트 및 기능 요청
- 이메일: <support@k-msg.dev>
- 문서: [docs.k-msg.dev](https://docs.k-msg.dev)
- Bun 자료: [bun.sh/docs](https://bun.sh/docs)
- Bun 이슈: [github.com/oven-sh/bun/issues](https://github.com/oven-sh/bun/issues)

---

## K-OTP (상업용 서비스)

K-OTP는 이 플랫폼을 기반으로 구축된 전문 OTP 인증 서비스입니다.

### 설치

```bash
npm install k-otp
```

### Better Auth 플러그인

```typescript
import { betterAuth } from "better-auth";
import { kotpPlugin } from "k-otp/better-auth";

export const auth = betterAuth({
  plugins: [
    kotpPlugin({
      apiKey: process.env.K_OTP_API_KEY!,
      baseURL: "https://api.k-otp.dev",
      templateId: "auth_otp",
      autoSignIn: true,
      maxAttempts: 3,
      resendDelay: 60
    })
  ]
});
```

### React 컴포넌트

```tsx
import { OTPForm, OTPInput } from "k-otp/better-auth/react";

function AuthPage() {
  return (
    <OTPForm
      onSuccess={(result) => console.log("Authentication successful:", result)}
      onError={(error) => console.error("Authentication failed:", error)}
    />
  );
}
```

자세한 K-OTP 사용법은 [commercial/k-otp/README.md](./commercial/k-otp/README.md)를 참조하세요.
