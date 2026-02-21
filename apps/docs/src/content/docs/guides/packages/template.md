---
title: "@k-msg/template"
description: "Generated from `packages/template/README_ko.md`"
---
K-Message 템플릿 런타임 생명주기/검증/개인화 로직의 단일 패키지입니다.

## 설치

```bash
npm install @k-msg/template @k-msg/core
# or
bun add @k-msg/template @k-msg/core
```

## Runtime API (`@k-msg/template`)

기본 export는 런타임 중심 API만 제공합니다.

- `TemplateLifecycleService`
- `TemplatePersonalizer`, `defaultTemplatePersonalizer`, `TemplateVariableUtils`
- `interpolate`
- `validateTemplatePayload`, `parseTemplateButtons`
- 저수준 parser (`ButtonParser`, `VariableParser`, `TemplateValidator`)

### Lifecycle Service

```typescript
import { TemplateLifecycleService } from "@k-msg/template";
import type { TemplateProvider } from "@k-msg/core";

const provider: TemplateProvider = /* provider 구현 */;
const templates = new TemplateLifecycleService(provider);

await templates.create({
  name: "OTP Verification",
  content: "[MyApp] Code: #{code}",
});
```

### 런타임 검증

```typescript
import { parseTemplateButtons, validateTemplatePayload } from "@k-msg/template";

const buttons = parseTemplateButtons('[{"type":"WL","name":"열기","url_mobile":"https://example.com"}]');
if (buttons.isFailure) throw buttons.error;

const payload = validateTemplatePayload(
  {
    name: "알림",
    content: "안녕하세요 #{name}",
    buttons: buttons.value,
  },
  { requireName: true, requireContent: true },
);

if (payload.isFailure) throw payload.error;
```

### 개인화

```typescript
import { TemplateVariableUtils } from "@k-msg/template";

const rendered = TemplateVariableUtils.replace("안녕하세요 #{name}", {
  name: "홍길동",
});
// "안녕하세요 홍길동"
```

## Toolkit API (`@k-msg/template/toolkit`)

빌더/레지스트리/테스트용 스토어는 서브패스로 분리됩니다.

- `TemplateBuilder`, `TemplateBuilders`
- `TemplateRegistry`
- `InMemoryTemplateStore`

```typescript
import { TemplateBuilders, TemplateRegistry } from "@k-msg/template/toolkit";

const registry = new TemplateRegistry();
const template = TemplateBuilders.authentication("OTP", "mock")
  .code("OTP_001")
  .content("Code: #{code}")
  .build();

await registry.register(template);
```

## 라이선스

MIT

