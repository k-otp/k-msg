---
title: "보안 용어집 (쉬운 설명)"
description: "fieldCrypto에서 자주 보는 보안 용어를 쉬운 말로 정리"
---
이 문서가 답하는 질문: `fieldCrypto` 설정에 나오는 보안 용어를 실무 관점에서 어떻게 이해하면 되는가?

## AAD

- 한 줄 정의: 암호문에 붙는 "봉인 정보"입니다.
- 왜 필요한가: 다른 레코드로 복사된 암호문이 복호화되지 않게 막습니다.
- 설정 예시(`safe`): `messageId`, `providerId`, `tableName`, `fieldPath`를 AAD에 포함
- 흔한 실수: 필드별 AAD를 다르게 주지 않아 복호화 불일치가 발생

## `kid`

- 한 줄 정의: 현재 사용 중인 암호화 키의 이름표입니다.
- 왜 필요한가: 키 교체(로테이션) 중에도 구키/신키를 동시에 읽을 수 있습니다.
- 설정 예시(`safe`): encrypt는 active `kid`, decrypt는 multi-`kid` 순차 시도
- 흔한 실수: 새 키로 쓰기 시작했는데 `resolveDecryptKeys`에 구키를 빼서 과거 데이터 복호화 실패

## `encrypt+hash`

- 한 줄 정의: 값은 암호화해서 저장하고, 검색은 해시로 하는 방식입니다.
- 왜 필요한가: deterministic encryption 없이도 안정적으로 조회할 수 있습니다.
- 설정 예시(`safe`): `to`, `from` 필드는 `encrypt+hash`
- 흔한 실수: 조회를 암호문 컬럼으로 시도해 인덱스를 못 타는 문제

## `failMode=closed`

- 한 줄 정의: 암복호화 오류가 나면 작업을 멈추는 안전 모드입니다.
- 왜 필요한가: 평문 유출 가능성이 있는 상태를 차단합니다.
- 설정 예시(`safe`): 기본값 그대로 사용
- 흔한 실수: 장애 대응 편의 때문에 기본을 `open`으로 바꾸고 장기 운영

## `failMode=open`

- 한 줄 정의: 암복호화 오류가 나도 fallback 정책으로 계속 처리하는 모드입니다.
- 왜 필요한가: 일부 운영 환경에서 가용성을 우선해야 할 때만 사용합니다.
- 설정 예시(`caution`): `openFallback: "masked"`
- 흔한 실수: `openFallback: "plaintext"`를 unsafe 승인 없이 사용

## `openFallback=plaintext`

- 한 줄 정의: 실패 시 평문으로 저장/반환하는 가장 위험한 fallback입니다.
- 왜 필요한가: 일반 운영에서는 필요 없습니다.
- 설정 예시(`unsafe`): 반드시 `unsafeAllowPlaintextStorage: true`를 명시해야 허용
- 흔한 실수: 임시 디버깅 설정을 프로덕션에 남김

## 다음 읽기

- [Field Crypto v1](./field-crypto-v1)
- [보안 레시피](./recipes)
