# Messaging Personalization Migration

## Breaking change

`@k-msg/messaging` no longer exports personalization helpers from the package root.

Removed exports:

- `VariableReplacer`
- `VariableUtils`
- `defaultVariableReplacer`

## New import path

Use `@k-msg/template` instead:

```ts
import {
  TemplatePersonalizer,
  TemplateVariableUtils,
  defaultTemplatePersonalizer,
} from "@k-msg/template";
```

## Mapping

- `VariableReplacer` -> `TemplatePersonalizer`
- `VariableUtils` -> `TemplateVariableUtils`
- `defaultVariableReplacer` -> `defaultTemplatePersonalizer`
