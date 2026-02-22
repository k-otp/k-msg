---
title: "마이그레이션 오케스트레이터"
description: "legacy -> secure 전환을 plan/apply/status/retry로 안전하게 운영하는 방법"
---
이 문서가 답하는 질문: 대용량 백필이 중단되어도 데이터 정합성을 유지하며 다시 시작하려면 어떻게 해야 하는가?

## 핵심 개념

- 한 줄 정의: 오케스트레이터는 `plan/apply/status/retry`로 백필 상태를 추적하는 실행 계층입니다.
- 왜 필요한가: 대용량 전환 중 실패 청크만 재시도하고 중복 업데이트를 피할 수 있습니다.
- 설정 예시(`safe`): DB 메타테이블 + 로컬 스냅샷을 동시에 사용
- 흔한 실수: 진행 상태를 로그에만 남겨 재시작 기준점이 사라짐

## CLI 흐름

```bash
k-msg db tracking migrate plan --sqlite-file ./local.db
k-msg db tracking migrate apply --sqlite-file ./local.db
k-msg db tracking migrate status --sqlite-file ./local.db
k-msg db tracking migrate retry --sqlite-file ./local.db
```

## 운영 체크포인트

1. `planId` 기준으로 동일 실행인지 확인합니다.
2. 실패 청크는 `retry`로만 재처리합니다.
3. `compatPlainColumns=false` 전환은 해시/암호문 정합성 검증 이후에 수행합니다.

## 위험 라벨

- `safe`: `status` 확인 후 점진 전환
- `caution`: apply 중 강제 중단 후 즉시 재실행
- `unsafe`: 상태 확인 없이 새 plan 생성

## 다음 문서

- [자동 완화](./auto-mitigation)
- [마이그레이션 CLI 런북 (root docs)](https://github.com/k-otp/k-msg/blob/main/docs/security/migration-cli-runbook.md)
