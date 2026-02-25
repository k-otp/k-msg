---
title: Provider 선택 가이드
description: IWINV, SOLAPI, Aligo 중 프로젝트에 맞는 Provider를 선택하는 방법
---

# Provider 선택 가이드

K-Message는 세 가지 주요 Provider를 지원합니다. 각 Provider는 서로 다른 특성과 강점을 가지고 있으므로, 프로젝트 요구사항에 맞게 선택해야 합니다.

## Provider 개요

### IWINV (아이윈브)

국내 클라우드 호스팅 기업 IWINV에서 제공하는 메시징 서비스입니다.

**특징:**
- 알림톡 전용 API와 SMS/LMS/MMS API가 분리되어 있음
- IP 화이트리스트 기반 보안
- 알림톡 템플릿 관리 API 제공
- 비교적 간단한 설정

**지원 채널:**
- 알림톡 (ALIMTALK)
- SMS / LMS / MMS (선택 설정 필요)

### SOLAPI (솔라피)

국내 대표 메시징 API 플랫폼입니다.

**특징:**
- 가장 다양한 채널 지원
- 공식 TypeScript SDK 제공
- RCS 메시지 지원
- 음성(FAX, VOICE) 채널 지원
- 풍부한 API 문서와 개발자 생태계

**지원 채널:**
- 알림톡 (ALIMTALK)
- 친구톡 (FRIENDTALK)
- SMS / LMS / MMS
- RCS (SMS/LMS/MMS/템플릿)
- 음성 (VOICE)
- 팩스 (FAX)
- 네이버톡 (NSA)

### Aligo (알리고)

카카오 비즈니스 메시지에 특화된 서비스입니다.

**특징:**
- 카카오 채널 관리 API 완벽 지원
- 템플릿 심사 요청 API 제공
- API 기반 채널 등록 가능
- 카카오 비즈니스 메시지 최적화

**지원 채널:**
- 알림톡 (ALIMTALK)
- 친구톡 (FRIENDTALK)
- SMS / LMS / MMS

## 비교표

| 기능 | IWINV | SOLAPI | Aligo |
|------|-------|--------|-------|
| **알림톡** | ✅ | ✅ | ✅ |
| **친구톡** | ❌ | ✅ | ✅ |
| **SMS/LMS/MMS** | ✅ | ✅ | ✅ |
| **RCS** | ❌ | ✅ | ❌ |
| **음성/팩스** | ❌ | ✅ | ❌ |
| **템플릿 API** | ✅ | ❌ | ✅ |
| **템플릿 심사 API** | ❌ | ❌ | ✅ |
| **카카오 채널 API** | ❌ | ❌ | ✅ |
| **잔액 조회** | ✅ | ✅ | ❌ |
| **배달 상태 조회** | ✅ | ✅ | ❌ |
| **공식 SDK** | ❌ | ✅ | ❌ |

## 선택 가이드

### 단순 SMS만 필요한 경우

**추천: SOLAPI**

```typescript
import { KMsg } from "k-msg";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
});

await kmsg.send({ to: "01012345678", text: "인증번호: 123456" });
```

SOLAPI는 가장 널리 사용되는 SMS API로, 안정성과 문서화가 뛰어납니다.

### 알림톡 중심 서비스

**추천: IWINV 또는 Aligo**

**IWINV 선택 시:**
- 간단한 설정 원할 때
- IP 기반 보안이 필요할 때
- 알림톡 템플릿 관리가 필요할 때

```typescript
import { KMsg } from "k-msg";
import { IWINVProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      senderNumber: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "iwinv",
  },
});

await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
});
```

**Aligo 선택 시:**
- API로 카카오 채널을 관리해야 할 때
- 템플릿 심사를 자동화해야 할 때
- 친구톡도 함께 사용할 때

```typescript
import { KMsg } from "k-msg";
import { AligoProvider } from "@k-msg/provider/aligo";

const kmsg = new KMsg({
  providers: [
    new AligoProvider({
      apiKey: process.env.ALIGO_API_KEY!,
      userId: process.env.ALIGO_USER_ID!,
      sender: "01000000000",
      senderKey: process.env.ALIGO_SENDER_KEY!,
    }),
  ],
});

await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "AUTH_OTP",
  variables: { code: "123456" },
});
```

### 다중 채널 통합

**추천: SOLAPI + IWINV 조합**

각 채널의 특성에 맞게 Provider를 분리하여 사용합니다.

```typescript
import { KMsg } from "k-msg";
import { SolapiProvider } from "@k-msg/provider/solapi";
import { IWINVProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      senderNumber: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      ALIMTALK: "iwinv", // 알림톡은 IWINV로
    },
  },
});

// SMS는 SOLAPI로 발송
await kmsg.send({ to: "01012345678", text: "SMS 메시지" });

// 알림톡은 IWINV로 발송
await kmsg.send({
  type: "ALIMTALK",
  to: "01012345678",
  templateCode: "TEMPLATE_CODE",
  variables: { name: "홍길동" },
});
```

### RCS 메시지 필요

**추천: SOLAPI**

```typescript
import { KMsg } from "k-msg";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
      rcsBrandId: process.env.SOLAPI_RCS_BRAND_ID,
    }),
  ],
});

await kmsg.send({
  type: "RCS_LMS",
  to: "01012345678",
  text: "RCS 메시지 본문",
  title: "RCS 메시지 제목",
});
```

### 카카오 채널 자동화

**추천: Aligo**

Aligo는 API로 카카오 채널 등록, 관리가 가능합니다.

```typescript
import { AligoProvider } from "@k-msg/provider/aligo";

const provider = new AligoProvider({
  apiKey: process.env.ALIGO_API_KEY!,
  userId: process.env.ALIGO_USER_ID!,
  sender: "01000000000",
  senderKey: process.env.ALIGO_SENDER_KEY!,
});

// 채널 목록 조회
const channels = await provider.listKakaoChannels();

// 채널 인증 요청
await provider.requestKakaoChannelAuth({
  plusId: "@yourbrand",
  phoneNumber: "01000000000",
});

// 채널 등록
await provider.addKakaoChannel({
  plusId: "@yourbrand",
  authNum: "123456",
  phoneNumber: "01000000000",
  categoryCode: "001",
});
```

## Provider 전환

Provider를 교체해야 할 때, KMsg 추상화 레이어 덕분에 최소한의 코드 변경만 필요합니다.

### SOLAPI → IWINV 전환

```typescript
// Before (SOLAPI)
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
});

// After (IWINV)
import { IWINVProvider } from "@k-msg/provider";

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      senderNumber: "01000000000",
    }),
  ],
});

// 메시지 발송 코드는 변경 없음
await kmsg.send({ to: "01012345678", text: "동일한 코드" });
```

### 환경 변수 정리

각 Provider별 필요한 환경 변수입니다.

**IWINV:**
```bash
IWINV_API_KEY=your_api_key           # 필수 (알림톡)
IWINV_SMS_API_KEY=your_sms_key       # SMS/LMS/MMS 사용 시
IWINV_SMS_AUTH_KEY=your_auth_key     # SMS/LMS/MMS 사용 시
IWINV_SENDER_NUMBER=01000000000      # 발신번호
```

**SOLAPI:**
```bash
SOLAPI_API_KEY=your_api_key          # 필수
SOLAPI_API_SECRET=your_api_secret    # 필수
SOLAPI_DEFAULT_FROM=01000000000      # 기본 발신번호
SOLAPI_KAKAO_PF_ID=your_pf_id        # 카카오 사용 시
SOLAPI_RCS_BRAND_ID=your_brand_id    # RCS 사용 시
```

**Aligo:**
```bash
ALIGO_API_KEY=your_api_key           # 필수
ALIGO_USER_ID=your_user_id           # 필수
ALIGO_SENDER=01000000000             # 발신번호
ALIGO_SENDER_KEY=your_sender_key     # 카카오 사용 시
```

## 요약

| 상황 | 추천 Provider |
|------|--------------|
| 단순 SMS만 | SOLAPI |
| 알림톡 중심 (간단 설정) | IWINV |
| 알림톡 중심 (채널 관리 필요) | Aligo |
| 다중 채널 | SOLAPI + IWINV |
| RCS 필요 | SOLAPI |
| 카카오 채널 자동화 | Aligo |
| 음성/팩스 | SOLAPI |

각 Provider의 상세 설정 방법은 해당 Provider 가이드를 참고하세요.
