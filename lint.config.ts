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
    // ttsc 0.19 aligned this rule with typescript-eslint, where a `default`
    // clause no longer covers unlisted union members. Keep `default` as
    // deliberate coverage; switches without one must still list every member.
    "typescript/switch-exhaustiveness-check": [
      "error",
      { considerDefaultExhaustiveForUnions: true },
    ],
  },
} satisfies ITtscLintConfig;
