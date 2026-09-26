---
npm/@k-msg/provider: patch
npm/@k-msg/cli: patch
---

Stop requiring a Kakao `plusId` for SOLAPI AlimTalk. SOLAPI identifies the channel by pfId (`kakao.profileId` or `config.kakaoPfId`) and never sends a plusId, but its onboarding spec declared `plusIdPolicy: "required_if_no_inference"` with inference unsupported, so `KMsg.send()` rejected every SOLAPI AlimTalk without `kakao.plusId` before calling the provider, and `k-msg alimtalk preflight` failed on it. The spec now declares the plusId optional and the CLI no longer asks for one for SOLAPI. Since SOLAPI has no template API for preflight to probe, `k-msg alimtalk preflight` now checks the pfId instead: `--sender-key`, a Kakao channel alias, or `solapi.config.kakaoPfId`. The setup checklist and READMEs point at the pfId binding.
