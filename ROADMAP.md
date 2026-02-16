# k-msg Roadmap (Checklist)

> Last validated: 2026-02-16
> This is a working checklist, not a fixed timeline.

## Validation Summary (Code-Checked)

### Implemented
- [x] Unified entry point `KMsg` with `send()`
- [x] Batch sending via `sendMany()` (concurrency control)
- [x] Routing basics: `providerId`, `routing.byType`, `defaultProviderId`, `first | round_robin`
- [x] Type-based message model (SMS/LMS/MMS/ALIMTALK/FRIENDTALK/NSA/VOICE/FAX/RCS)
- [x] ALIMTALK failover option normalization + warning codes
- [x] Tracking-based API failover flow (`DeliveryTrackingService`)
- [x] Queue/retry foundations (`SQLiteJobQueue`, `MessageRetryHandler`)
- [x] Built-in providers: Solapi / IWINV / Aligo / Mock

### Partial / Needs Hardening
- [ ] Observability contract is standardized (trace/span/event schema)
- [ ] Dynamic routing policy (quality/cost/health-aware)
- [ ] Common template lifecycle (`draft/review/publish`)
- [ ] Operations KPI/reporting scenarios are standardized

### Not Implemented Yet
- [ ] `schedule()` contract on common `KMsg` API
- [ ] Interface-level idempotency contract (`idempotencyKey`)
- [ ] Policy DSL routing model
- [ ] Template versioning/approval workflow
- [ ] SLO/error-budget operation documents

---

## Candidate Work Items (Editable)

### P1 (Near-term, high impact)
- [ ] Define error taxonomy (retryable/non-retryable, user/system cause)
- [ ] Define minimum observability fields and event names
- [ ] Draft idempotency storage interface + TTL/collision rules
- [ ] Clarify docs: "currently supported" vs "planned"

### P2 (After P1 stabilizes)
- [ ] Add policy-based routing layer on top of current routing
- [ ] Unify fallback policy model across channels/providers
- [ ] Standardize bulk result summary format for operations

### P3 (Optional expansion)
- [ ] Add `schedule` API with timezone/retry policy
- [ ] Introduce template workflow abstraction
- [ ] Prepare provider onboarding SDK/guide and `k-msg doctor` concept

---

## Decision Rules

- [ ] Keep backward compatibility for existing `send()` usage
- [ ] Ship docs/tests/samples together with feature changes
- [ ] Re-validate checklist against code before each release
