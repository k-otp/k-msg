---
npm/@k-msg/provider: patch
---

IWINV send errors now carry IWINV's own code and text.

- A failed AlimTalk or SMS/LMS/MMS send sets `providerErrorCode` to IWINV's integer `code` (AlimTalk) or `resultCode` (SMS v2) as a string, `providerErrorText` to IWINV's `message`, and `httpStatus` to the response status. Before, the code was only in `details.originalCode`, which `normalizeProviderError` does not read, so callers saw an empty `providerErrorCode` (for example on IWINV's "조직(업체) 발신번호가 일치하지 않습니다." refusal, code `13`).
- `httpStatus` is new on these errors and takes part in retry classification: a policy's `retryableStatuses`/`nonRetryableStatuses` now match IWINV send errors whose `code` no configured `retryableCodes`/`nonRetryableCodes` entry lists (a configured code entry still wins), and a custom code list that leaves the error's `code` out now falls back to the HTTP status. Custom retry policies keyed on HTTP status or on custom code lists may classify IWINV send errors differently.
- `providerErrorText` and the error message are IWINV's text, cleaned: control characters become spaces, phone-like runs of nine or more digits become `***`, and the text is cut to 500 characters (an AlimTalk non-JSON body in the message too). The text is IWINV's and can echo message content (AlimTalk `540` names the blocked word), so treat it as sensitive.
- For a bare-code SMS response, `providerErrorText` is the text IWINV documents for that code. A body that is not an integer code, such as plain-text `Forbidden` or an HTML error page, sets neither field, and a plain-text SMS body no longer becomes `details.originalCode`.
- The normalized `code` is unchanged.
