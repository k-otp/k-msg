---
npm/@k-msg/provider: patch
---

IWINV AlimTalk sends answered with the success code as a string (`{"code":"200"}`) are reported as sent.

- The AlimTalk success check compared `code` strictly to the number `200`, so a 2xx answer carrying `"200"` failed as `INVALID_REQUEST` ("not sent") although IWINV had accepted it; a consumer that retried or failed over could send twice. The code is now read as an integer whether it arrives as a number or a string, and `200` on a 2xx answer is a success.
- `seqNo` sent as a digit string becomes `providerMessageId`, like a numeric one.
- A string refusal code (`{"code":"505"}`) still maps like the number. A code that is not an integer (`"200.0"`, `"2e2"`) counts as no code, which on a 2xx answer is `PROVIDER_ERROR`, an unknown outcome; before, such a code was parsed as a number and mapped by its value.
- SMS/LMS/MMS v2 already accepted `resultCode` `0` as a number or string; a test now pins it.
