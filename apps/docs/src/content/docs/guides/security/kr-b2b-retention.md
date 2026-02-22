---
title: "KR B2B 보관 정책"
description: "KR B2B baseline 보관/폐기 정책과 계약 우선 규칙"
---
`k-msg`는 KR B2B 환경을 위한 보관 정책 프리셋을 제공합니다.

## 기본 보관 주기 (KR preset)

- 운영 로그(`opsLogs`): `90일`
- 통신 메타데이터(`telecomMetadata`): `365일`
- 과금/정산 증빙(`billingEvidence`): `1825일`

## 우선순위 규칙

1. 테넌트 계약(조기파기 포함)
2. 제품 정책 프리셋
3. 법정 기본값

즉, 계약서에서 더 짧은 보관 기간을 요구하면 계약 조건이 우선 적용됩니다.

## 스키마/운영 포인트

- 공통 컬럼: `retention_class`, `retention_bucket_ym`
- Postgres/MySQL: 파티션 DDL 템플릿 사용
- SQLite/D1: 버킷 인덱스 기반 chunk delete로 동등 의미 보장

## 구현 권장사항

- 본문/OTP는 단기 보관(`1~7일`) 후 폐기
- 로그/이벤트에는 평문 대신 마스킹 값만 기록
- 폐기 배치는 대량 `DELETE`보다 버킷/파티션 단위 정리를 우선

상세 정책 문서:

- [docs/compliance/kr-b2b-retention.md](https://github.com/k-otp/k-msg/blob/main/docs/compliance/kr-b2b-retention.md)
