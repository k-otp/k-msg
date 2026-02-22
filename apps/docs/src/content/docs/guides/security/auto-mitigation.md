---
title: "자동 완화 (Control Signal)"
description: "crypto_fail_count를 제어 신호로 사용해 key 오류를 scope 단위로 자동 격리하는 방법"
---
이 문서가 답하는 질문: 키 오류가 급증할 때 전체 서비스가 아니라 문제 scope만 자동으로 격리하려면 어떻게 해야 하는가?

## 핵심 개념

- 한 줄 정의: `CryptoCircuitController`는 실패 지표를 받아 scope별 회로 상태를 전환합니다.
- 왜 필요한가: 한 테넌트/프로바이더/키 문제가 전체 트래픽으로 번지는 것을 막습니다.
- 설정 예시(`safe`): scope=`tenant+provider+kid`, key/AAD/kid 불일치 계열만 auto-open
- 흔한 실수: 일반 네트워크 오류까지 auto-open 대상으로 포함

## 상태 전이

1. `closed`: 정상
2. `open`: 임계치 초과 시 격리
3. `half-open`: cooldown 후 소량 재시도
4. `closed`: 정상 응답이 확인되면 복구

## 운영 이벤트

- 구조화 이벤트: state, scope, reason, errorClass
- 메트릭: `crypto_circuit_state`, `crypto_circuit_open_count`
- 런북 트리거: open 전이 시 운영자 알림 자동 발행

## 위험 라벨

- `safe`: key 오류 계열만 자동 격리
- `caution`: 임계치가 너무 낮아 과민 반응
- `unsafe`: scope 없이 글로벌 격리

## 다음 문서

- [보안 레시피](./recipes)
- [Control Signal 운영 문서 (root docs)](https://github.com/k-otp/k-msg/blob/main/docs/security/crypto-control-signals.md)
