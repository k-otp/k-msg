---
npm/@k-msg/cli: patch
---

Align the CLI bootstrap with Bunli type-generation by registering commands from
`apps/cli/.bunli/commands.gen.ts`, and run `bunli generate` before local `test`,
`dev`, and `build:js` scripts so command registration works reliably in fresh
environments and CI.
