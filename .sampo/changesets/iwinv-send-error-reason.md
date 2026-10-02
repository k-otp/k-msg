---
npm/@k-msg/provider: minor
---

IWINV send errors name the refusal in `details.reason`.

- A failed IWINV send sets `details.reason` when IWINV's code or text identifies the refusal: `SENDER_NUMBER_NOT_REGISTERED` (SMS `13`, AlimTalk `505`, or a text such as "조직(업체) 발신번호가 일치하지 않습니다."), `IP_NOT_ALLOWED` (SMS `15`/`206`, AlimTalk `206`), `RECIPIENT_NUMBER_INVALID` (SMS `41`), and `AUTO_CHARGE_LIMIT_EXCEEDED` (SMS `50`). New exports: `IWINV_SEND_ERROR_REASONS`, the `IWINVSendErrorReason` type, and `getIWINVSendErrorReason(error)`, which reads the reason without a cast. No `KMsgErrorCode` is added.
- A sender-number or IP refusal that only IWINV's text identifies is now `INVALID_REQUEST` or `AUTHENTICATION_FAILED` where it used to be the generic, retried `PROVIDER_ERROR` or `NETWORK_ERROR` of an unlisted code. A rate limit, an HTTP 5xx or a 5xx code keeps its code.
- The HTTP status now decides first: an SMS or AlimTalk send answered with HTTP `429` is `RATE_LIMIT_EXCEEDED`, and one answered with HTTP 5xx is `NETWORK_ERROR` (SMS) or `PROVIDER_ERROR` (AlimTalk), whatever code the body holds. Before, an SMS `429` was `NETWORK_ERROR`, a listed code in the body won over either status, and an AlimTalk HTTP 5xx without a body code could be the non-retryable `INVALID_REQUEST` or `TEMPLATE_NOT_FOUND`.
- An AlimTalk response whose body has no code is otherwise classified by its HTTP status, and a string `code` is read as a number (a string `"505"` was `PROVIDER_ERROR` and is now `INVALID_REQUEST`).
