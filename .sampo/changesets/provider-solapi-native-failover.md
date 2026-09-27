---
npm/@k-msg/provider: patch
---

Stop SOLAPI AlimTalk sends from getting a second fallback message. With `failover.enabled` and a sender number (`from` or `defaultFrom`), SOLAPI replaces a failed AlimTalk with SMS/LMS itself (`kakaoOptions.disableSms: false`), but the send also carried a `FAILOVER_PARTIAL_PROVIDER` warning, which makes `DeliveryTrackingService` with `apiFailover` resend the fallback once the AlimTalk is tracked as failed for a non-Kakao user, so the customer could get it twice. SOLAPI now returns the warning only when the AlimTalk has no sender number, the one case where SOLAPI cannot send the fallback. The messaging README's tracking-based failover example leaves SOLAPI without a sender for this reason.
