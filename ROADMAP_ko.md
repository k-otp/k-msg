# k-msg 로드맵 (체크리스트)

> 마지막 검증: 2026-02-16
> 이 문서는 확정 일정표가 아니라, 수시로 수정 가능한 작업 체크리스트입니다.

## 검증 요약 (코드 기준)

### 구현됨
- [x] `KMsg` 통합 진입점 + `send()`
- [x] `sendMany()` 배치 전송(동시성 제어)
- [x] 기본 라우팅: `providerId`, `routing.byType`, `defaultProviderId`, `first | round_robin`
- [x] 타입 기반 메시지 모델 (SMS/LMS/MMS/ALIMTALK/FRIENDTALK/NSA/VOICE/FAX/RCS)
- [x] ALIMTALK failover 옵션 표준화 + warning 코드
- [x] Tracking 기반 API failover 플로우 (`DeliveryTrackingService`)
- [x] 큐/재시도 기반 (`SQLiteJobQueue`, `MessageRetryHandler`)
- [x] 기본 provider: Solapi / IWINV / Aligo / Mock

### 부분 구현 / 보강 필요
- [ ] 관측성 계약 표준화(trace/span/event 스키마)
- [ ] 동적 라우팅 정책(품질/비용/헬스 기반)
- [ ] 공통 템플릿 라이프사이클(`draft/review/publish`)
- [ ] 운영 KPI/리포팅 시나리오 표준화

### 미구현
- [ ] 공통 `KMsg` API의 `schedule()` 계약
- [ ] 인터페이스 레벨 idempotency 계약(`idempotencyKey`)
- [ ] 정책 DSL 라우팅 모델
- [ ] 템플릿 버전/승인 워크플로우
- [ ] SLO/Error budget 운영 문서

---

## 후보 작업 목록 (수정용)

### P1 (가까운 우선순위)
- [ ] 에러 taxonomy 정리(재시도 가능/불가, 사용자/시스템 원인)
- [ ] 최소 관측성 필드/이벤트 이름 확정
- [ ] idempotency 저장소 인터페이스 + TTL/충돌 규칙 초안
- [ ] 문서에서 "현재 지원"과 "계획" 범위 명확 분리

### P2 (P1 안정화 이후)
- [ ] 기존 라우팅 위에 정책 기반 라우팅 레이어 추가
- [ ] 채널/프로바이더 공통 fallback 정책 모델 정리
- [ ] 운영용 배치 결과 집계 포맷 표준화

### P3 (확장 항목)
- [ ] `schedule` API + 타임존/재시도 정책
- [ ] 템플릿 워크플로우 추상화
- [ ] provider 온보딩 SDK/가이드 + `k-msg doctor` 구상

---

## 의사결정 규칙

- [ ] 기존 `send()` 사용 코드는 하위호환 유지
- [ ] 기능 추가 시 문서/테스트/샘플 동시 반영
- [ ] 릴리스 전 체크리스트를 코드 기준으로 재검증
