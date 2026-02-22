---
title: "보안 레시피"
description: "비전문가도 바로 적용할 수 있는 fieldCrypto 설정 패턴"
---
이 문서가 답하는 질문: 보안 배경지식이 많지 않아도 어떤 설정 조합을 바로 적용하면 안전한가?

## 레시피 1: 가장 안전한 기본값 (`safe`)

```ts
const fieldCrypto = {
  enabled: true,
  failMode: "closed",
  fields: {
    to: "encrypt+hash",
    from: "encrypt+hash",
  },
  provider,
};
```

- 언제 사용하나: 신규 도입, 개인정보 저장이 있는 대부분의 서비스
- 기대 효과: 평문 저장 차단 + 해시 조회 인덱스 사용

## 레시피 2: 점진 전환 (`caution`)

```ts
fieldCryptoSchema: {
  enabled: true,
  mode: "secure",
  compatPlainColumns: true,
}
```

- 언제 사용하나: 기존 평문 컬럼이 있는 서비스의 무중단 전환
- 운영 순서: 컬럼 추가 -> 백필 -> 조회 검증 -> `compatPlainColumns=false`
- 주의점: 전환 기간을 짧게 유지

## 레시피 3: 장애 시 fail-open 최소화 (`caution`)

```ts
const fieldCrypto = {
  failMode: "open",
  openFallback: "masked",
  // plaintext fallback 금지
};
```

- 언제 사용하나: 일시적으로 가용성을 우선해야 할 때
- 필수 조건: `crypto_fail_count` 알람 + 복구 후 `closed` 복귀

## 레시피 4: 절대 피해야 할 설정 (`unsafe`)

```ts
const fieldCrypto = {
  failMode: "open",
  openFallback: "plaintext",
  // unsafeAllowPlaintextStorage 미설정
};
```

- 결과: 초기화 단계에서 즉시 실패(정상 동작)
- 이유: 평문 저장 위험이 너무 커서 명시적 unsafe 승인 없이는 금지

## 운영 체크리스트 (3단계)

1. `to/from` 필드가 `encrypt+hash`인지 확인
2. `failMode`가 기본 `closed`인지 확인
3. `crypto_fail_count`, `key_kid_usage` 지표 대시보드 연결 확인

## 다음 읽기

- [보안 용어집](./glossary)
- [KR B2B 보관 정책](./kr-b2b-retention)
