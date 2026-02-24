---
title: "마케팅 메시지"
description: "친구톡과 SMS를 활용한 마케팅 메시지 발송 가이드입니다."
---

마케팅 메시지는 프로모션, 이벤트 안내, 쿠폰 발송 등 고객 참여를 유도하는 메시지입니다. 수신 동의를 받은 고객에게만 발송할 수 있으며, 채널 선택과 발송 전략이 중요합니다. 이 가이드에서는 친구톡과 SMS를 활용한 마케팅 메시지 발송 방법을 알아봅니다.

## 시나리오 설명

마케팅 메시지의 주요 유형:

1. **프로모션 안내**: 할인 행사, 특가 상품 안내
2. **이벤트 초대**: 런칭 파티, 팬미팅, 워크샵
3. **쿠폰 발송**: 생일 쿠폰, 웰컴 쿠폰, 복귀 쿠폰
4. **신상품 안내**: 시즌 신상품, 신메뉴 런칭

마케팅 메시지의 핵심 고려사항:
- 수신 동의 여부 확인
- 발송 시간 최적화
- 스팸 필터링 회피
- 비용 대비 효과 측정

## 메시지 타입 선택

### 친구톡 vs SMS 비교

| 기준 | 친구톡 | SMS |
|------|--------|-----|
| 발송 조건 | 카카오 채널 친구 + 수신 동의 | 수신 동의만 |
| 비용 | 건당 5~15원 | 건당 15~30원 |
| 오픈율 | 60~80% | 70~90% |
| 포맷팅 | 이미지, 버튼 지원 | 텍스트만 |
| 도달률 | 카카오톡 사용자만 | 모든 휴대폰 |

### 선택 기준

```
친구톡 권장:
- 브랜드 충성도가 높은 고객
- 이미 카카오 채널 친구
- 이미지/버튼이 필요한 캠페인
- 대량 발송으로 비용 절감 필요

SMS 권장:
- 신규 고객 (채널 친구 아님)
- 긴급성 있는 메시지
- 간단한 텍스트 메시지
- 모든 고객에게 도달 필요
```

## 전체 코드 예제

### 1. KMsg 인스턴스 구성

```ts
import { KMsg } from "@k-msg/messaging";
import { IWINVProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";

const kmsg = new KMsg({
  providers: [
    new IWINVProvider({
      apiKey: process.env.IWINV_API_KEY!,
      baseUrl: "https://alimtalk.bizservice.iwinv.kr",
    }),
    new SolapiProvider({
      apiKey: process.env.SOLAPI_API_KEY!,
      apiSecret: process.env.SOLAPI_API_SECRET!,
      defaultFrom: "01000000000",
    }),
  ],
  routing: {
    defaultProviderId: "solapi",
    byType: {
      FRIENDTALK: "iwinv",
      SMS: "solapi",
      LMS: "solapi",
    },
  },
  defaults: {
    kakao: {
      plusId: process.env.KAKAO_PLUS_ID!, // 카카오 플러스 친구 ID
    },
  },
});
```

### 2. 친구톡 마케팅 메시지

```ts
interface MarketingTarget {
  phoneNumber: string;
  name: string;
  isKakaoFriend: boolean;
  consentedAt: Date;
}

async function sendFriendTalkMarketing(
  targets: MarketingTarget[],
  campaign: {
    title: string;
    content: string;
    imageUrl?: string;
    buttonUrl?: string;
    buttonText?: string;
  },
) {
  // 친구톡은 채널 친구에게만 발송
  const friendTalkTargets = targets.filter((t) => t.isKakaoFriend);

  const results = [];

  for (const target of friendTalkTargets) {
    const result = await kmsg.send({
      type: "FRIENDTALK",
      to: target.phoneNumber,
      text: campaign.content.replace("#{이름}", target.name),
      // 이미지와 버튼이 있는 경우
      // kakao: {
      //   imageUrl: campaign.imageUrl,
      //   button: {
      //     name: campaign.buttonText,
      //     url: campaign.buttonUrl,
      //   },
      // },
    });

    results.push({
      phoneNumber: target.phoneNumber,
      success: result.isSuccess,
      messageId: result.isSuccess ? result.value.messageId : undefined,
      error: result.isFailure ? result.error.message : undefined,
    });
  }

  return results;
}

// 사용 예시
const results = await sendFriendTalkMarketing(
  [
    { phoneNumber: "01011112222", name: "홍길동", isKakaoFriend: true, consentedAt: new Date() },
    { phoneNumber: "01033334444", name: "김철수", isKakaoFriend: true, consentedAt: new Date() },
  ],
  {
    title: "봄맞이 세일",
    content: "#{이름}님, 봄맞이 특별 세일을 놓치지 마세요!\n최대 50% 할인 + 무료배송\n기간: 2월 25일~28일",
  },
);
```

### 3. SMS 마케팅 메시지

```ts
async function sendSMSMarketing(
  targets: MarketingTarget[],
  message: string,
) {
  const results = [];

  for (const target of targets) {
    const personalizedMessage = message.replace("#{이름}", target.name);
    
    const result = await kmsg.send({
      to: target.phoneNumber,
      text: personalizedMessage,
    });

    results.push({
      phoneNumber: target.phoneNumber,
      success: result.isSuccess,
      messageId: result.isSuccess ? result.value.messageId : undefined,
      error: result.isFailure ? result.error.message : undefined,
    });
  }

  return results;
}

// 사용 예시
await sendSMSMarketing(
  [
    { phoneNumber: "01011112222", name: "홍길동", isKakaoFriend: false, consentedAt: new Date() },
    { phoneNumber: "01033334444", name: "김철수", isKakaoFriend: false, consentedAt: new Date() },
  ],
  "[봄맞이 세일] #{이름}님, 최대 50% 할인! 2/25~28. 거부는 080-XXX-XXXX",
);
```

### 4. 대량 발송 (배치 처리)

```ts
async function sendBulkMarketing(
  targets: MarketingTarget[],
  campaign: {
    friendTalkContent: string;
    smsContent: string;
  },
) {
  // 친구톡 대상과 SMS 대상 분리
  const friendTalkTargets = targets.filter((t) => t.isKakaoFriend);
  const smsTargets = targets.filter((t) => !t.isKakaoFriend);

  const allResults = [];

  // 친구톡 일괄 발송
  if (friendTalkTargets.length > 0) {
    const friendTalkMessages = friendTalkTargets.map((t) => ({
      type: "FRIENDTALK" as const,
      to: t.phoneNumber,
      text: campaign.friendTalkContent.replace("#{이름}", t.name),
    }));

    const ftResults = await kmsg.send(friendTalkMessages);
    
    ftResults.results.forEach((result, index) => {
      allResults.push({
        phoneNumber: friendTalkTargets[index].phoneNumber,
        channel: "FRIENDTALK",
        success: result.isSuccess,
      });
    });
  }

  // SMS 일괄 발송
  if (smsTargets.length > 0) {
    const smsMessages = smsTargets.map((t) => ({
      to: t.phoneNumber,
      text: campaign.smsContent.replace("#{이름}", t.name),
    }));

    const smsResults = await kmsg.send(smsMessages);
    
    smsResults.results.forEach((result, index) => {
      allResults.push({
        phoneNumber: smsTargets[index].phoneNumber,
        channel: "SMS",
        success: result.isSuccess,
      });
    });
  }

  return {
    total: targets.length,
    friendTalkCount: friendTalkTargets.length,
    smsCount: smsTargets.length,
    results: allResults,
  };
}

// 사용 예시
const bulkResult = await sendBulkMarketing(
  // DB에서 조회한 마케팅 대상
  await getMarketingTargets(),
  {
    friendTalkContent: "#{이름}님, 특별 혜택이 도착했어요!\n클릭해서 확인하세요 👉",
    smsContent: "[특별혜택] #{이름}님, 전용 쿠폰이 발급되었습니다. 거부는 080-XXX-XXXX",
  },
);

console.log(`발송 완료: 친구톡 ${bulkResult.friendTalkCount}건, SMS ${bulkResult.smsCount}건`);
```

### 5. 생일 쿠폰 발송

```ts
interface BirthdayTarget {
  phoneNumber: string;
  name: string;
  birthDate: Date;
  couponCode: string;
}

async function sendBirthdayCoupon(target: BirthdayTarget) {
  const month = target.birthDate.getMonth() + 1;
  const day = target.birthDate.getDate();

  const result = await kmsg.send({
    type: "FRIENDTALK",
    to: target.phoneNumber,
    text: `🎂 ${target.name}님, 생일을 진심으로 축하드립니다!

🎁 생일 특별 쿠폰
코드: ${target.couponCode}
할인: 20% (최대 1만원)
기간: ${month}/${day} ~ ${month}/${day + 7}

생일을 함께 축하해주셔서 감사합니다.`,
  });

  return result;
}
```

## 수신 동의 관리

### 동의 확인 함수

```ts
interface ConsentInfo {
  phoneNumber: string;
  marketingConsent: boolean;
  consentedAt?: Date;
  channel: "KAKAO" | "SMS" | "ALL";
}

async function checkMarketingConsent(phoneNumber: string): Promise<ConsentInfo> {
  // DB에서 동의 정보 조회 (의사 코드)
  const consent = await db.marketingConsents.findUnique({
    where: { phoneNumber },
  });

  if (!consent) {
    return {
      phoneNumber,
      marketingConsent: false,
      channel: "ALL",
    };
  }

  return {
    phoneNumber,
    marketingConsent: consent.marketingConsent,
    consentedAt: consent.consentedAt,
    channel: consent.channel,
  };
}

// 발송 전 동의 확인
async function sendWithConsentCheck(
  target: MarketingTarget,
  message: string,
  channel: "FRIENDTALK" | "SMS",
) {
  const consent = await checkMarketingConsent(target.phoneNumber);

  if (!consent.marketingConsent) {
    return {
      success: false,
      reason: "수신 동의 없음",
    };
  }

  // 동의 채널 확인
  if (channel === "FRIENDTALK" && consent.channel === "SMS") {
    // 친구톡 동의가 없으면 SMS로 대체
    return kmsg.send({ to: target.phoneNumber, text: message });
  }

  if (channel === "FRIENDTALK") {
    return kmsg.send({ type: "FRIENDTALK", to: target.phoneNumber, text: message });
  }

  return kmsg.send({ to: target.phoneNumber, text: message });
}
```

## 에러 처리 방법

### 발송 실패 처리

```ts
async function sendMarketingWithErrorHandling(
  targets: MarketingTarget[],
  message: string,
) {
  const results = {
    success: 0,
    failed: 0,
    invalidNumbers: 0,
    consentMissing: 0,
  };

  for (const target of targets) {
    const consent = await checkMarketingConsent(target.phoneNumber);
    
    if (!consent.marketingConsent) {
      results.consentMissing++;
      continue;
    }

    const result = await kmsg.send({
      to: target.phoneNumber,
      text: message,
    });

    if (result.isSuccess) {
      results.success++;
    } else {
      results.failed++;
      
      if (result.error.code === "INVALID_PHONE_NUMBER") {
        results.invalidNumbers++;
      }
    }
  }

  return results;
}
```

### 발송 결과 리포트

```ts
interface SendReport {
  campaignId: string;
  totalTargets: number;
  successCount: number;
  failedCount: number;
  channelBreakdown: {
    friendTalk: number;
    sms: number;
  };
  failedReasons: Record<string, number>;
}

async function generateSendReport(
  campaignId: string,
  results: Array<{ channel: string; success: boolean; error?: string }>,
): Promise<SendReport> {
  const report: SendReport = {
    campaignId,
    totalTargets: results.length,
    successCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
    channelBreakdown: {
      friendTalk: results.filter((r) => r.channel === "FRIENDTALK").length,
      sms: results.filter((r) => r.channel === "SMS").length,
    },
    failedReasons: {},
  };

  // 실패 원인 집계
  results
    .filter((r) => !r.success && r.error)
    .forEach((r) => {
      report.failedReasons[r.error!] = (report.failedReasons[r.error!] || 0) + 1;
    });

  return report;
}
```

## 모범 사례

### 1. 발송 시간 최적화

```ts
// 최적 발송 시간 확인 (업종별 상이)
const OPTIMAL_HOURS = {
  morning: { start: 9, end: 11 },    // 오전 9~11시
  afternoon: { start: 14, end: 16 }, // 오후 2~4시
  evening: { start: 18, end: 20 },   // 저녁 6~8시
};

function isInOptimalTime(): boolean {
  const hour = new Date().getHours();
  
  return (
    (hour >= OPTIMAL_HOURS.morning.start && hour <= OPTIMAL_HOURS.morning.end) ||
    (hour >= OPTIMAL_HOURS.afternoon.start && hour <= OPTIMAL_HOURS.afternoon.end) ||
    (hour >= OPTIMAL_HOURS.evening.start && hour <= OPTIMAL_HOURS.evening.end)
  );
}

// 발송 전 시간 확인
if (!isInOptimalTime()) {
  console.log("현재는 최적 발송 시간이 아닙니다. 발송을 예약합니다.");
  // 큐에 저장 후 적절한 시간에 발송
}
```

### 2. 080 수신거부 번호 포함

```ts
// SMS에 수신거부 번호 필수 포함
const smsContent = `${message}

거부: 080-XXX-XXXX`;
```

### 3. 발송 주기 관리

```ts
// 동일 고객에게 과도한 발송 방지
const MIN_DAYS_BETWEEN_MARKETING = 7; // 최소 7일 간격

async function canSendMarketing(phoneNumber: string): Promise<boolean> {
  const lastSent = await db.marketingLogs.findFirst({
    where: { phoneNumber },
    orderBy: { sentAt: "desc" },
  });

  if (!lastSent) return true;

  const daysSinceLastSent = Math.floor(
    (Date.now() - lastSent.sentAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysSinceLastSent >= MIN_DAYS_BETWEEN_MARKETING;
}
```

### 4. A/B 테스트

```ts
async function runABTest(
  targets: MarketingTarget[],
  variants: {
    a: string;
    b: string;
  },
  sampleRatio: number = 0.1, // 10%만 테스트
) {
  const sampleSize = Math.floor(targets.length * sampleRatio);
  const sampleTargets = targets.slice(0, sampleSize);
  const remainingTargets = targets.slice(sampleSize);

  const groupA = sampleTargets.filter((_, i) => i % 2 === 0);
  const groupB = sampleTargets.filter((_, i) => i % 2 === 1);

  // A 그룹 발송
  const resultsA = await sendSMSMarketing(groupA, variants.a);
  
  // B 그룹 발송
  const resultsB = await sendSMSMarketing(groupB, variants.b);

  return {
    variantA: { count: groupA.length, successRate: resultsA.filter((r) => r.success).length / groupA.length },
    variantB: { count: groupB.length, successRate: resultsB.filter((r) => r.success).length / groupB.length },
    remainingTargets, // 승자 variant로 나머지 발송
  };
}
```

## 요약

- 채널 선택은 고객 특성(채널 친구 여부)에 따라 결정하세요
- 수신 동의 확인은 필수입니다
- 080 수신거부 번호를 반드시 포함하세요
- 발송 시간과 주기를 관리하여 스팸으로 분류되지 않도록 주의하세요
- 대량 발송은 배치 처리로 성능을 최적화하세요
- A/B 테스트로 메시지 효과를 측정하세요
