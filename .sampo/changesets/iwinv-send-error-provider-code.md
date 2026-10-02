---
npm/@k-msg/provider: patch
---

IWINV send errors now carry IWINV's own code and text.

- A failed AlimTalk or SMS/LMS/MMS send sets `providerErrorCode` to IWINV's `code` (AlimTalk) or `resultCode` (SMS v2) as a string, `providerErrorText` to IWINV's `message`, and `httpStatus` to the response status. Before, the code was only in `details.originalCode`, which `normalizeProviderError` does not read, so callers saw an empty `providerErrorCode` (for example on IWINV's "조직(업체) 발신번호가 일치하지 않습니다." refusal, code `13`).
- For a bare-code SMS response, `providerErrorText` is the text IWINV documents for that code. A body that is not a code, such as an HTML error page, sets neither field.
- The normalized `code`, `details.originalCode`, and the error message are unchanged, except that surrounding whitespace is now trimmed from IWINV's message.
