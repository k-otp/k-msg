---
npm/@k-msg/provider: minor
---

IWINV send errors name the refusal in `details.reason`.

- A failed IWINV send sets `details.reason` (exported type `IWINVSendErrorReason`) when IWINV's code or text identifies the refusal: `SENDER_NUMBER_NOT_REGISTERED` (SMS `13`, AlimTalk `505`, or a text such as "조직(업체) 발신번호가 일치하지 않습니다."), `IP_NOT_ALLOWED` (SMS `15`/`206`), `RECIPIENT_NUMBER_INVALID` (SMS `41`, AlimTalk `512`/`513`), and `AUTO_CHARGE_LIMIT_EXCEEDED` (SMS `50`). No `KMsgErrorCode` is added.
- A sender-number refusal is now always `INVALID_REQUEST`, and an IP refusal `AUTHENTICATION_FAILED`, also when IWINV reports it under a code its tables do not list. Before, such a refusal became `PROVIDER_ERROR` (or `NETWORK_ERROR` on a non-OK response), which the default retry policy retries.
