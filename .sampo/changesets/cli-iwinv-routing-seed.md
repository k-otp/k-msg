---
npm/@k-msg/provider: patch
npm/@k-msg/cli: patch
---

Route a new IWINV entry only for the message types its credentials can send. `k-msg config provider add` and `config init` seeded every IWINV entry into the `ALIMTALK`, `SMS`, `LMS` and `MMS` routes, so an SMS-only entry became an AlimTalk route that `KMsg` picked and failed on instead of using another provider. `ProviderCliMetadata` gains an optional `routingSeedTypesForConfig`, which IWINV sets from the same rule `IWINVProvider` uses for `supportedTypes`.
