---
npm/@k-msg/provider: patch
---

IWINV AlimTalk sends answered 2xx without a numeric code fail as `PROVIDER_ERROR`.

- An AlimTalk answer with HTTP 2xx and no numeric `code` (`{}`, `{"code":"x"}`, an empty body) was mapped from the HTTP status to `INVALID_REQUEST`, a non-retryable refusal that consumers treat as "not sent". It is now `PROVIDER_ERROR`: IWINV may have accepted the send, so the outcome is unknown. SMS/LMS/MMS already mapped these answers to `PROVIDER_ERROR`; tests now pin it.
- An AlimTalk answer with HTTP 2xx and a plain-text body (e.g. `OK`) was taken as a successful send, because the missing code was replaced by the HTTP status `200`. It now fails as `PROVIDER_ERROR` as well. `details.originalCode` of a non-JSON body is still the HTTP status.
- A numeric refusal code on HTTP 200 (AlimTalk `501`, `508`, `519`; SMS `13`, `41`, `50`, `202`) keeps its classification.
