export type TypecheckTarget = {
  category: "application" | "example" | "package" | "tooling";
  label: string;
  tsconfig: string;
};

// Keep dependency providers before consumers so failures point at the smallest
// responsible project first. The order is derived from the checked graph.
export const typecheckTargets: readonly TypecheckTarget[] = [
  {
    category: "package",
    label: "@k-msg/core",
    tsconfig: "packages/core/tsconfig.json",
  },
  {
    category: "package",
    label: "@k-msg/template",
    tsconfig: "packages/template/tsconfig.json",
  },
  {
    category: "package",
    label: "@k-msg/provider",
    tsconfig: "packages/provider/tsconfig.json",
  },
  {
    category: "package",
    label: "@k-msg/messaging",
    tsconfig: "packages/messaging/tsconfig.json",
  },
  {
    category: "package",
    label: "@k-msg/channel",
    tsconfig: "packages/channel/tsconfig.json",
  },
  {
    category: "package",
    label: "@k-msg/webhook",
    tsconfig: "packages/webhook/tsconfig.json",
  },
  {
    category: "package",
    label: "@k-msg/analytics",
    tsconfig: "packages/analytics/tsconfig.json",
  },
  {
    category: "package",
    label: "k-msg",
    tsconfig: "packages/k-msg/tsconfig.json",
  },
  {
    category: "application",
    label: "CLI",
    tsconfig: "apps/cli/tsconfig.json",
  },
  {
    category: "tooling",
    label: "repository tooling",
    tsconfig: "tsconfig.tooling.json",
  },
  {
    category: "example",
    label: "Hono Bun send-only example",
    tsconfig: "examples/hono-bun-send-only/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Hono Pages tracking example",
    tsconfig: "examples/hono-pages-tracking-hyperdrive/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Hono Pages send-only example",
    tsconfig: "examples/hono-pages-send-only/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Hono Worker queue example",
    tsconfig: "examples/hono-worker-queue-do/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Hono Worker tracking example",
    tsconfig: "examples/hono-worker-tracking-d1/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Hono Worker webhook example",
    tsconfig: "examples/hono-worker-webhook-d1/tsconfig.workspace.json",
  },
] as const;

export const docsTypecheckBoundary = {
  reason:
    "TypeDoc and Starlight currently require the docs-local TypeScript 6 toolchain.",
  validationCommand: "bun run docs:check",
  workspace: "apps/docs",
} as const;
