---
title: "보안 정책"
description: "k-msg field crypto(v1) 보안 정책과 운영 기준"
---
`k-msg`는 보안 감사 대응을 위해 `fieldCrypto` 기반의 공통 정책을 제공합니다.

이 섹션은 저장 시점 암호화, 조회용 해시, 키 로테이션, 실패 정책, 보관/폐기 기준을 사용자 관점에서 정리합니다.

## 문서 구성

- [Field Crypto v1](./field-crypto-v1): 암호화 모델, AAD, 실패 정책, 운영 지표
- [KR B2B 보관 정책](./kr-b2b-retention): 법정 보관 주기 기본값과 테넌트 계약 우선순위

## 핵심 원칙

- 기본 모드는 `secure`이며 평문 저장은 기본 금지입니다.
- `failMode` 기본값은 `closed`입니다.
- 조회 인덱스는 암호문이 아니라 `HMAC-SHA256` 해시를 사용합니다.
- `tenant` 조기 파기 조건이 법정 기본값보다 우선합니다.

소스 오브 트루스:

- [docs/security/field-crypto-v1.md](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-v1.md)
- [docs/security/field-crypto-runbook.md](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-runbook.md)
- [docs/compliance/kr-b2b-retention.md](https://github.com/k-otp/k-msg/blob/main/docs/compliance/kr-b2b-retention.md)
