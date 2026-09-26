---
npm/@k-msg/channel: patch
npm/@k-msg/cli: patch
---

Stop `KakaoChannelBindingResolver.resolve()` from giving one provider the Kakao channel of another. It took the senderKey and plusId of the named alias, or of the `defaults.kakao.channel` alias, without checking which provider the alias was bound to. It now skips the senderKey, plusId and name of an alias bound to a provider other than the one it resolves for, and falls through to that provider's own config (`senderKey`, SOLAPI `kakaoPfId`, `profileId`, `plusId`) or leaves them unset. `defaults.kakao.senderKey` and `defaults.kakao.plusId` name no provider and still apply to all of them.

CLI commands that resolve a binding for a provider other than the alias's change with it:

- `k-msg alimtalk send` and `k-msg alimtalk preflight` no longer use the default channel alias, or a `--channel` alias, of another provider. With the `config init --template full` config, whose default alias `main` is bound to aligo, `alimtalk send --provider solapi` sent `ALIGO_SENDER_KEY` as SOLAPI's pfId even when `solapi.config.kakaoPfId` was set; it now sends that pfId. Preflight checks the provider with its own senderKey and plusId, so for Aligo it infers the plusId of Aligo's own channel. `--channel` still does not choose the provider, which is `--provider` or else the default AlimTalk provider, so pass `--provider` with an alias of any other provider.
- `k-msg alimtalk send --interactive` asks for the senderKey, and a plusId where the provider requires one, instead of taking them from the default alias of another provider.
- `k-msg kakao template` commands with a `--provider` other than the alias's use that provider's own senderKey, if it has one, as the template context.
- `k-msg kakao channel binding resolve` reports the provider's own binding and leaves out the name of a skipped alias.
