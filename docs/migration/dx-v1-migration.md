# DX v1 Migration Guide

This guide covers breaking changes and migration paths for upgrading to the unified `KMsg` API.

## Summary

The v1 release unifies the public API around `new KMsg({ providers })` + `send({ type, ... })`. Legacy abstractions (`Platform`, `UniversalProvider`, `StandardRequest`) have been removed.

## Breaking Changes

### 1. Message Discriminant: `channel` → `type`

The message type field was renamed from `channel` to `type`.

**Before (legacy):**
```ts
await kmsg.send({
  channel: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456' },
});
```

**After (v1):**
```ts
await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456' },
});
```

**Migration:**
- Global find/replace `channel:` with `type:` in send calls
- Update any custom types that reference `channel`

---

### 2. Template Identifier: `templateCode` → `templateId`

The AlimTalk template field was renamed for consistency.

**Before (legacy):**
```ts
await kmsg.send({
  channel: 'ALIMTALK',
  to: '01012345678',
  templateCode: 'AUTH_OTP',
  variables: { code: '123456' },
});
```

**After (v1):**
```ts
await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456' },
});
```

**Migration:**
- Global find/replace `templateCode:` with `templateId:` in AlimTalk sends

---

### 3. Legacy APIs Removed

The following public APIs have been removed entirely:

| Removed API | Replacement |
|-------------|-------------|
| `Platform` | `KMsg` class |
| `UniversalProvider` | `Provider` interface + concrete providers |
| `StandardRequest` | `SendInput` / `SendOptions` types |

**Before (legacy):**
```ts
import { Platform, UniversalProvider, StandardRequest } from '@k-msg/core';

const platform = new Platform({
  providers: [provider],
});

const request: StandardRequest = {
  channel: 'SMS',
  to: '01012345678',
  message: 'Hello',
};

await platform.send(request);
```

**After (v1):**
```ts
import { KMsg } from 'k-msg';
import { IWINVProvider } from '@k-msg/provider';

const kmsg = new KMsg({
  providers: [new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! })],
});

await kmsg.send({
  type: 'SMS',
  to: '01012345678',
  text: 'Hello',
});
```

---

### 4. Provider Import Paths

Provider imports have been consolidated. The main `@k-msg/provider` path now exports runtime-neutral providers.

| Old Path | New Path |
|----------|----------|
| `@k-msg/provider/iwinv` | `@k-msg/provider` (includes `IWINVProvider`) |
| `@k-msg/provider/aligo` | `@k-msg/provider/aligo` (subpath still available) |
| `@k-msg/provider/solapi` | `@k-msg/provider/solapi` (subpath required for peer dep) |

**Before (legacy):**
```ts
import { IWINVProvider } from '@k-msg/provider/iwinv';
import { AligoProvider } from '@k-msg/provider/aligo';
```

**After (v1):**
```ts
// IWINVProvider is now on the main path
import { IWINVProvider, AligoProvider } from '@k-msg/provider';

// SolapiProvider requires subpath (peer dep isolation)
import { SolapiProvider } from '@k-msg/provider/solapi';
```

**Migration:**
- Update IWINV imports to use the main `@k-msg/provider` path
- Keep Solapi imports as-is (subpath required for optional peer dependency)

---

### 5. Message Field: `message` → `text`

The message content field was renamed for clarity.

**Before (legacy):**
```ts
await kmsg.send({
  channel: 'SMS',
  to: '01012345678',
  message: 'Hello world',
});
```

**After (v1):**
```ts
await kmsg.send({
  type: 'SMS',
  to: '01012345678',
  text: 'Hello world',
});
```

---

## Deprecated → New API Mapping

### KMsg Instantiation

The direct constructor call remains supported, but factory methods are available for ergonomics.

| Pattern | Use Case |
|---------|----------|
| `new KMsg({ providers })` | Full configuration (default) |
| `KMsg.create({ providers })` | Functional style alias |
| `KMsg.simple(provider)` | Single-provider shortcut |
| `KMsg.builder().addProvider(...).build()` | Fluent configuration |

**Single Provider (simplified):**
```ts
// Before
const kmsg = new KMsg({
  providers: [new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! })],
  routing: { defaultProviderId: 'iwinv' },
});

// After (using simple)
const kmsg = KMsg.simple(new IWINVProvider({ apiKey: process.env.IWINV_API_KEY! }));
```

**Builder Pattern (multi-provider):**
```ts
const kmsg = KMsg.builder()
  .addProvider(new SolapiProvider({
    apiKey: process.env.SOLAPI_API_KEY!,
    apiSecret: process.env.SOLAPI_API_SECRET!,
    defaultFrom: '01000000000',
  }))
  .addProvider(new IWINVProvider({
    apiKey: process.env.IWINV_API_KEY!,
  }))
  .withRouting({
    defaultProviderId: 'solapi',
    byType: { ALIMTALK: 'iwinv' },
  })
  .withDefaults({
    from: '01000000000',
    sms: { autoLmsBytes: 90 },
  })
  .build();
```

---

### Tracking / Queue Imports

Runtime-specific exports moved to adapter subpaths.

| Old Import (removed from root) | New Import |
|--------------------------------|------------|
| `BunSqlDeliveryTrackingStore` | `@k-msg/messaging/adapters/bun` |
| `SqliteDeliveryTrackingStore` | `@k-msg/messaging/adapters/bun` |
| `SQLiteJobQueue` | `@k-msg/messaging/adapters/bun` |
| `JobProcessor` | `@k-msg/messaging/adapters/node` |
| `MessageJobProcessor` | `@k-msg/messaging/adapters/node` |
| `MessageRetryHandler` | `@k-msg/messaging/adapters/node` |
| `createDeliveryTrackingHooks` | `@k-msg/messaging/tracking` |
| `DeliveryTrackingService` | `@k-msg/messaging/tracking` |
| `InMemoryDeliveryTrackingStore` | `@k-msg/messaging/tracking` |
| `BulkMessageSender` | `@k-msg/messaging/sender` |
| `Job`, `JobQueue`, `JobStatus` | `@k-msg/messaging/queue` |

---

## Gradual Migration Strategy

### Phase 1: Type Updates (Low Risk)

1. Update all `channel:` to `type:` in send calls
2. Update all `templateCode:` to `templateId:`
3. Update all `message:` to `text:`

These are simple find/replace operations with no runtime impact.

### Phase 2: Import Updates (Medium Risk)

1. Update provider imports:
   ```bash
   # Find IWINV subpath imports
   grep -r "@k-msg/provider/iwinv" src/
   
   # Replace with main path
   # Before: import { IWINVProvider } from '@k-msg/provider/iwinv';
   # After:  import { IWINVProvider } from '@k-msg/provider';
   ```

2. Update tracking/queue imports to adapter subpaths

### Phase 3: Legacy API Removal (High Risk)

1. Remove any `Platform`, `UniversalProvider`, `StandardRequest` usage
2. Migrate to `KMsg` facade pattern
3. Update custom types to use `SendInput` / `SendOptions`

---

## Quick Reference

### Full Migration Example

**Before (legacy):**
```ts
import { Platform, UniversalProvider, StandardRequest } from '@k-msg/core';
import { IWINVProvider } from '@k-msg/provider/iwinv';

const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
});

const platform = new Platform({ providers: [provider] });

const request: StandardRequest = {
  channel: 'ALIMTALK',
  to: '01012345678',
  templateCode: 'AUTH_OTP',
  variables: { code: '123456' },
};

await platform.send(request);
```

**After (v1):**
```ts
import { KMsg } from 'k-msg';
import { IWINVProvider } from '@k-msg/provider';

const kmsg = KMsg.simple(new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY!,
}));

await kmsg.send({
  type: 'ALIMTALK',
  to: '01012345678',
  templateId: 'AUTH_OTP',
  variables: { code: '123456' },
});
```

---

## TypeScript Migration

Update your type imports:

```ts
// Before
import type { StandardRequest, MessageChannel } from '@k-msg/core';

// After
import type { SendInput, MessageType } from '@k-msg/core';
```

Type mapping:

| Legacy Type | New Type |
|-------------|----------|
| `StandardRequest` | `SendInput` |
| `MessageChannel` | `MessageType` |
| `SendResult.status` | `DeliveryStatus` |

---

## Need Help?

- Documentation: [k-msg.and.guide](https://k-msg.and.guide)
- Issues: [GitHub Issues](https://github.com/k-otp/k-msg/issues)
- Korean docs: [k-msg.and.guide/guides/](https://k-msg.and.guide/guides/)
