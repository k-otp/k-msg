# Field Crypto 기본 안내 (쉬운 설명)

이 문서가 답하는 질문: `fieldCrypto`가 왜 필요하고, 처음에 어떤 설정을 쓰면 안전한가?

## 1) 어떤 문제를 해결하나

- 민감 필드(`to`, `from`, 선택한 metadata path)의 평문 저장을 막습니다.
- deterministic encryption 없이 `*_hash` 컬럼으로 조회를 유지합니다.
- `kid` 기반 키 로테이션을 지원합니다.

## 2) 안전한 기본값

- `failMode: "closed"` (기본값)
- 조회 필드(`to`, `from`)는 `encrypt+hash`
- `openFallback: "plaintext"`는 명시적 unsafe 승인 없이는 금지
- AAD는 `messageId`, `providerId`, `tableName`, `fieldPath` 포함

## 3) 꼭 알아야 할 용어

- `AAD`: 암호문에 묶는 봉인 정보
- `kid`: 키 식별자(로테이션용)
- `encrypt+hash`: 암호화 저장 + 해시 조회
- `degraded`: fail-open fallback이 적용된 상태

## 4) 흔한 실수

- secure 모드에서 조회 필드를 `plain`으로 두는 설정
- 프로덕션에서 `openFallback=plaintext` 사용
- 키 교체 시 구키 decrypt 후보를 너무 빨리 제거

## 5) 다음 문서

- `./field-crypto-v1.md` (기술 사양)
- `./field-crypto-runbook.md` (운영 대응)
- `../migration/field-crypto-migration.md` (마이그레이션 절차)
