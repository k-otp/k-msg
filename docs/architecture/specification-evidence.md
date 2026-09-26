# Specification Evidence

`@ttsc/evidence` turns selected normative documents into compile-time obligations. `bun run typecheck` fails when a governed section has no acknowledgement in code, when a citation points at a section that no longer exists, or when a review was written against text that has since changed.

## Governed Documents

| Document | Units | Claim hosts | Why it is governed |
| --- | --- | --- | --- |
| [`docs/security/field-crypto-v1.md`](../security/field-crypto-v1.md) | every H2 | `packages/core/src/crypto`, `packages/core/src/logger.ts`, and the messaging and webhook `field-crypto.ts` modules | The policy contract for encryption, envelopes, fail modes, field modes, and log redaction must hold in every package that stores protected fields. |
| [`docs/compliance/kr-b2b-retention.md`](../compliance/kr-b2b-retention.md) | every H2 | `packages/messaging/src/delivery-tracking/retention.ts` | Compliance baseline numbers must match the shipped preset. |

Both references set `requireReview`, so each acknowledgement carries a fingerprint of the section it cites.

Only a document the code fully implements should be governed: an acknowledgement certifies the whole section. A section several packages implement, such as the field policy modes, is cited from each implementing declaration. The generated [citation map](./typescript-graph.md#specification-evidence) shows which declaration answers each section.

## Wiring

- [`lint.evidence.config.ts`](../../lint.evidence.config.ts) extends the shared `lint.config.ts` and registers the `evidence` contributor with the `evidence/graph` rule.
- [`tsconfig.evidence.json`](../../tsconfig.evidence.json) is a program anchored at the repository root over `packages/*/src`, so claim globs are repository-relative. Package tsconfigs keep the shared lint config, so the evidence rule runs once per validation instead of once per package.
- [`tsconfig.graph.json`](../../tsconfig.graph.json) points `@ttsc/lint` at the same config. `@ttsc/graph` therefore indexes each governed section as a `markdown_section` node with `doc_ref` edges from the code that cites it, and the graph MCP server can answer which code implements a section.

## Tags

Tags are read only from JSDoc on exported declarations inside a claim's files.

```ts
/**
 * @evidence docs/compliance/kr-b2b-retention.md#contract-precedence
 *   Why this declaration answers for the section.
 * @evidenceReview docs/compliance/kr-b2b-retention.md#contract-precedence #f0e1afd
 *   What you read or ran to verify it.
 */
```

- `@evidence <target> <reason>` states why the declaration answers for a section.
- `@evidenceReview <target> #<fingerprint> <statement>` states what was verified. The fingerprint is printed by the failing diagnostic.
- `@evidenceExclude <target> <reason>` with `@evidenceExcludeReview` records that a section owes no code, such as navigation links or operator guidance.

## Workflows

### A governed section changes

1. Edit the document.
2. `bun run typecheck` reports `Stale @evidenceReview ... now digests to '#…'` for that section only.
3. Re-read the section and the cited declaration. Change the code when it no longer satisfies the text.
4. Update the review fingerprint and rewrite its statement to describe the new verification. Never update only the fingerprint.

### A section is added or renamed

The build reports `Missing acknowledgement` for the new anchor and a dangling target for a renamed one. Cite the section from the declaration that implements it, or exclude it with a reason, then add the review the diagnostic asks for.

### Governing another document

1. Close any gap between the document and the code first, then add a claim to `lint.evidence.config.ts`. Keep `requireReview` for policy or compliance text.
2. Keep the claim hosts inside `tsconfig.evidence.json`; `packages/*/src` already covers the runtime packages.
3. Run `bun run typecheck` and treat the missing acknowledgements as the task list.
4. Run `bun run graph:ttsc:snapshot` and review the citation map diff.

## Boundaries

- The gate proves that every governed section is acknowledged and that each review was written against the current text. It does not judge whether a reason or review is true; code review does.
- JSDoc tags ship in published declaration files. They document which policy a public type implements.
- Test files are outside the claim populations. Requiring tests to cite the policy sections they verify is a possible next step.
