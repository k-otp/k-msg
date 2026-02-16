---
npm/k-msg: minor
---

Formalize ALIMTALK `failover` options and expose provider warning metadata.

- Add standardized failover fields (`enabled`, `fallbackChannel`, `fallbackContent`, `fallbackTitle`) and `warnings` in send results.
- Add provider failover mapping/warnings for `iwinv`, `solapi`, `aligo`, and `mock`.
- Add delivery-tracking-based API-level SMS/LMS fallback for non-Kakao-user ALIMTALK failures (single attempt).
- Add CLI failover flags and warning output to make behavior consistent across providers.
