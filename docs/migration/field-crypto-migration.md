# Field Crypto Migration (legacy -> secure)

## 1. Enable secure schema

Enable secure tracking schema in store creation:

```ts
fieldCryptoSchema: {
  enabled: true,
  mode: "secure",
  compatPlainColumns: false,
}
```

An existing table keeps its schema: the tracking store only creates the secure columns for new tables. Add them as nullable columns before migrating (`to_enc`, `to_hash`, `to_masked`, `from_enc`, `from_hash`, `from_masked`, `metadata_enc`, `metadata_hashes`, `crypto_kid`, `crypto_version INTEGER NOT NULL DEFAULT 1`, `crypto_state`, `retention_class`, `retention_bucket_ym`).

For staged migration:

```ts
fieldCryptoSchema: {
  enabled: true,
  mode: "secure",
  compatPlainColumns: true,
}
```

## 2. Configure field policy

Recommended minimum:

```ts
fields: {
  to: "encrypt+hash",
  from: "encrypt+hash",
}
```

## 3. Backfill order

1. Add secure columns and indexes
2. Backfill `to_enc`, `to_hash`, `from_enc`, `from_hash` with `applyFieldCryptoMigration`, passing the tracking store's `fieldCrypto` options. Rows whose `crypto_state` is empty, `plain`, or `degraded` are encrypted from the plain columns; a row that cannot be encrypted, including one whose plain recipient is empty, fails its chunk instead of storing fallback values. The backfill can run alongside live writes: it updates a row only while the row's state, recipient, sender, provider, and metadata still match what it read, and otherwise re-reads the row and encrypts its current values, leaving a row that a writer already encrypted as it is
3. Switch read path to secure mode
4. Disable plain compatibility (`compatPlainColumns=false`)
5. Drop the legacy `to` and `from` columns. The backfill leaves them in place, so they hold plaintext until they are dropped. Drop `metadata` only after setting `fields.metadata` to `encrypt` or `encrypt+hash` and verifying `metadata_enc`: with the default policy, metadata lives only in the plain column, so dropping it deletes it

## 4. Query migration

- Legacy lookup: `WHERE to = ?`
- Secure lookup: `WHERE to_hash = HMAC(normalized(to))`

## 5. Rollback strategy

- Keep `compatPlainColumns=true` until post-cutover validation is complete.
- Keep multi-kid decrypt configured during rollback window.

## 6. Webhook storage migration

Webhook storage config uses `fieldCrypto` as the only crypto contract.

- Configure `fieldCrypto.endpoint` for endpoint `secret`
- Configure `fieldCrypto.delivery` for delivery `payload`
- Remove legacy config keys from deployment manifests before upgrade
