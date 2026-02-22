---
title: "Field Crypto v1"
description: "k-msg 보안감사 대응 암호화 정책(v1) 요약"
---
`fieldCrypto`는 `@k-msg/core`, `@k-msg/messaging`, `@k-msg/webhook`에서 공통으로 사용하는 필드 단위 암호화 계층입니다.

## 지원 모드

- `plain`: 평문 저장 (기본 정책에서는 비권장)
- `encrypt`: 암호화 저장
- `encrypt+hash`: 암호화 저장 + 조회용 해시 생성
- `mask`: 마스킹 저장

## 기본 보안 정책

- 기능을 활성화한 소비자는 `secure default`가 적용됩니다.
- `failMode` 기본값은 `closed`입니다.
- `openFallback: "plaintext"`는 `unsafeAllowPlaintextStorage: true`가 없으면 거부됩니다.
- Envelope 포맷은 `{ v, alg, kid, iv, tag, ct }` JSON 텍스트를 사용합니다.
- 인코딩은 dialect 공통성을 위해 `base64url`을 사용합니다.

## 조회/인덱스 정책

- 전화번호 조회는 deterministic encryption에 의존하지 않습니다.
- `to_hash`, `from_hash` 인덱스를 사용합니다.
- 해시는 `HMAC-SHA256(normalizedValue)` 기준입니다.

## AAD 및 키 로테이션

- 기본 AAD: `messageId`, `providerId`, `tableName`, `fieldPath` (+ `tenantId` 선택)
- encrypt 시 `active kid`, decrypt 시 `multi-kid` 순차 시도로 로테이션을 지원합니다.

## 운영 시 확인할 지표

- `crypto_encrypt_ms`
- `crypto_decrypt_ms`
- `crypto_fail_count`
- `key_kid_usage`

## 장애 대응 포인트

- `crypto_fail_count` 급증: 키/환경 변수/입력 포맷 점검
- `kid` 불일치: keyResolver와 active key 배포 상태 점검
- 백필 중단: `add columns -> index -> backfill -> legacy drop(optional)` 순서 재시도

추가 상세:

- [Migration 가이드](https://github.com/k-otp/k-msg/blob/main/docs/migration/field-crypto-migration.md)
- [운영 런북](https://github.com/k-otp/k-msg/blob/main/docs/security/field-crypto-runbook.md)
