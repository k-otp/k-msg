import type { ITtscLintConfig } from "@ttsc/lint";

export default {
  ignores: [
    "apps/docs/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/dist/**",
    "**/node_modules/**",
  ],
  rules: {
    "typescript/await-thenable": "error",
    "typescript/no-for-in-array": "error",
    "typescript/switch-exhaustiveness-check": "error",
  },
} satisfies ITtscLintConfig;
