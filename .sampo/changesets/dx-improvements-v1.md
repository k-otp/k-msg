---
"@k-msg/core": minor
"@k-msg/messaging": minor
"@k-msg/provider": minor
"k-msg": minor
---

feat(dx): unified Provider imports, KMsg builder pattern, Result extensions, field-level crypto, comprehensive guides

## Breaking Changes
- Legacy `Platform` / `UniversalProvider` / `StandardRequest` public APIs removed
- Message discriminant is `type` (old `channel` naming removed)
- `templateCode` renamed to `templateId`

## New Features

### API Improvements
- **Unified Provider imports**: All providers now importable from `@k-msg/provider`
- **KMsg.simple()**: One-liner for single provider setup
- **KMsg.builder()**: Fluent API for complex configurations
- **Result extensions**: `tap`, `tapOk`, `tapErr`, `expect` methods
- **Error localization**: `KMsgError.getLocalizedMessage(locale)`

### Documentation
- Getting started tutorial with Mock Provider
- Message types comparison guide
- Provider selection guide
- Troubleshooting guide with FAQ
- Use case guides (OTP, order notification, marketing)
- DX v1 migration guide
- Field crypto section with privacy warnings
