export type TypecheckTarget = {
  category:
    | "application"
    | "evidence"
    | "example"
    | "package"
    | "test"
    | "tooling";
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
  // Package tsconfigs exclude tests so they never reach published declarations;
  // this target type-checks them instead.
  {
    category: "test",
    label: "package tests",
    tsconfig: "tsconfig.test.json",
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
  // Runs after the packages so a type error surfaces in its own package first;
  // this target owns specification coverage and review expiry.
  {
    category: "evidence",
    label: "specification evidence",
    tsconfig: "tsconfig.evidence.json",
  },
  {
    category: "example",
    label: "Node Express OTP example",
    tsconfig: "examples/node-express-otp/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Bun order notifications example",
    tsconfig: "examples/bun-order-notifications/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Cloudflare Worker D1 example",
    tsconfig: "examples/cloudflare-worker-d1/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Cloudflare Worker queue example",
    tsconfig: "examples/cloudflare-worker-queue-do/tsconfig.workspace.json",
  },
  {
    category: "example",
    label: "Cloudflare Worker Hyperdrive example",
    tsconfig: "examples/cloudflare-worker-hyperdrive/tsconfig.workspace.json",
  },
] as const;

export const docsTypecheckBoundary = {
  reason:
    "TypeDoc and Starlight currently require the docs-local TypeScript 6 toolchain.",
  validationCommand: "bun run docs:check",
  workspace: "apps/docs",
} as const;
