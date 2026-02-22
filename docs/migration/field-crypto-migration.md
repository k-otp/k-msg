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
2. Backfill `to_enc`, `to_hash`, `from_enc`, `from_hash`
3. Switch read path to secure mode
4. Disable plain compatibility (`compatPlainColumns=false`)
5. Optionally drop legacy plain columns

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
