---
npm/@k-msg/provider: patch
npm/@k-msg/cli: patch
---

Stop requiring a Kakao `plusId` for SOLAPI AlimTalk. SOLAPI identifies the channel by pfId (`kakao.profileId` or `config.kakaoPfId`) and never sends a plusId, but its onboarding spec declared `plusIdPolicy: "required_if_no_inference"` with inference unsupported, so `KMsg.send()` rejected every SOLAPI AlimTalk without `kakao.plusId` before calling the provider, and `k-msg alimtalk preflight` failed on it. The spec now declares the plusId optional, the CLI no longer asks for one for SOLAPI, and its setup checklist and READMEs point at the pfId binding instead.
