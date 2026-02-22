---
title: "키 관리와 로테이션"
description: "KeyResolver와 KMS/Vault/ENV 어댑터로 무중단 키 교체를 운영하는 방법"
---
이 문서가 답하는 질문: 키를 바꿔도 서비스 중단 없이 읽기/쓰기를 유지하려면 무엇을 설정해야 하는가?

## 핵심 개념

- 한 줄 정의: `KeyResolver`는 암호화 키 선택 로직을 앱 코드에서 분리하는 인터페이스입니다.
- 왜 필요한가: 키 수명주기(생성/활성/폐기)와 비즈니스 로직을 분리해 운영 리스크를 줄입니다.
- 설정 예시(`safe`): encrypt는 active `kid`, decrypt는 old/new/new2 순으로 다중 키 시도
- 흔한 실수: 새 키 활성화 직후 구키를 decrypt 후보에서 제거

## 운영 레시피

1. `ENV`, `AWS KMS`, `Vault Transit` 중 하나로 resolver를 구성합니다.
2. `createRollingKeyResolver`로 rollout 비율(예: 10% -> 50% -> 100%)을 적용합니다.
3. 복호화는 항상 다중 `kid` 집합을 유지해 2회 연속 로테이션(A->B->C)을 지원합니다.

## 위험 라벨

- `safe`: active `kid` + multi-decrypt `kid`
- `caution`: rollout 비율 변경 직후 모니터링 없는 즉시 100%
- `unsafe`: decrypt 키 집합에 이전 `kid` 미포함

## 다음 문서

- [자동 완화](./auto-mitigation)
- [키 로테이션 운영 런북 (root docs)](https://github.com/k-otp/k-msg/blob/main/docs/security/key-rotation-playbook.md)
