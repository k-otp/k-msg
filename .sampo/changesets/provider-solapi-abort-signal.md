---
npm/@k-msg/provider: minor
---

Let `SolapiProvider` observe the request's abort signal, so `kmsg.send(input, { signal: AbortSignal.timeout(ms) })` bounds SOLAPI calls too. The SOLAPI SDK takes no signal, and the provider ignored the one it was given, so a slow SOLAPI request held the caller for as long as it took. `send()` and `getDeliveryStatus()` now check the signal before each SDK call and stop waiting when it aborts, returning `REQUEST_ABORTED`, or `NETWORK_TIMEOUT` for a timeout, as the other providers do; an MMS, FriendTalk image, RCS or fax send aborted during its file upload is not sent. A send request the SDK already made cannot be cancelled, and SOLAPI may still deliver it, so an abort after that point returns `REQUEST_ABORTED` with `details.requestSent: true` even for a timeout, since retrying could deliver the message twice. `transportCapabilities.abortSignal` is now `"supported"`; `injectableFetch` stays `"unsupported"`.
