# Field Crypto Basics (Plain Language)

Question this page answers: What does `fieldCrypto` do, and which settings are safe defaults for day-1 rollout?

## 1) What problem it solves

- Prevents plaintext persistence of sensitive fields (`to`, `from`, selected metadata paths).
- Keeps lookup capability using hash columns (`*_hash`) instead of deterministic encryption.
- Supports key rotation with `kid`.

## 2) Safe defaults

- `failMode: "closed"` (default)
- lookup fields use `encrypt+hash`
- `openFallback: "plaintext"` disabled unless explicitly unsafe-approved
- AAD includes `messageId`, `providerId`, `tableName`, `fieldPath`

## 3) Terms you need

- `AAD`: seal context bound to ciphertext
- `kid`: key identifier for rotation
- `encrypt+hash`: encrypted storage + hash lookup
- `degraded`: fail-open fallback path state

## 4) Common mistakes

- Using `plain` for lookup fields in secure mode
- Enabling `openFallback=plaintext` in production
- Rotating keys without keeping old decrypt keys

## 5) Read next

- `./field-crypto-v1.md` (technical spec)
- `./field-crypto-runbook.md` (operations)
- `../migration/field-crypto-migration.md` (migration steps)
