/**
 * E2E Integration tests for CLI commands
 */

import { beforeAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { spawn } from "bun";

const CLI_ROOT = path.join(import.meta.dir, "..");
const CLI_SRC_PATH = path.join(import.meta.dir, "cli.ts");
const CLI_DIST_PATH = path.join(CLI_ROOT, "dist", "cli.js");
const FIXTURE_PLUGIN_PATH = path.join(
  import.meta.dir,
  "fixtures",
  "mock-provider.plugin.ts",
);
const TEST_TIMEOUT = 30000;
const ANSI_PATTERN = new RegExp("\\u001b\\[[0-9;]*m", "g");

function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, "");
}

async function runCli(
  args: string[],
  env: Record<string, string | undefined>,
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = spawn(["bun", CLI_DIST_PATH, ...args], { env, cwd: CLI_ROOT });
  const [stdout, stderr, exitCode] = await Promise.all([
    proc.stdout ? new Response(proc.stdout).text() : "",
    proc.stderr ? new Response(proc.stderr).text() : "",
    proc.exited,
  ]);

  return { exitCode, stdout, stderr };
}

describe("CLI E2E Tests", () => {
  const mockEnv = {
    ...process.env,
    K_MSG_MOCK: "true",
  };

  beforeAll(async () => {
    // Use the built JS CLI to avoid flaky TS runtime/transpiler issues in CI.
    const build = spawn(
      [
        "bun",
        "build",
        CLI_SRC_PATH,
        "--outdir=dist",
        "--format=esm",
        "--target=node",
      ],
      { cwd: CLI_ROOT, env: process.env },
    );
    const [exitCode, stderr] = await Promise.all([
      build.exited,
      build.stderr ? new Response(build.stderr).text() : "",
    ]);
    if (exitCode !== 0) {
      throw new Error(
        `Failed to build CLI for tests (exitCode=${exitCode}): ${stderr}`,
      );
    }
  });

  test(
    "should show help",
    async () => {
      const { exitCode, stdout, stderr } = await runCli(["--help"], mockEnv);
      const plain = stripAnsi(stdout + stderr);

      expect([0, 1]).toContain(exitCode);
      expect(plain).toContain("K-Message CLI");
      expect(plain).toContain("-h, --help");
    },
    TEST_TIMEOUT,
  );

  test(
    "should show version",
    async () => {
      const { exitCode, stdout, stderr } = await runCli(
        ["--version"],
        mockEnv,
      );
      const plain = stripAnsi(stdout + stderr);

      expect(exitCode).toBe(0);
      expect(plain).toContain("0.2.0");
    },
    TEST_TIMEOUT,
  );

  test(
    "should show info",
    async () => {
      const { exitCode, stdout, stderr } = await runCli(["info"], mockEnv);
      const plain = stripAnsi(stdout + stderr);

      expect(exitCode).toBe(0);
      expect(plain).toContain("Platform Information");
      expect(plain).toContain("Providers: mock");
      expect(plain).toContain("Supported Channels:");
    },
    TEST_TIMEOUT,
  );

  test(
    "should perform health check with mock provider",
    async () => {
      const { exitCode, stdout, stderr } = await runCli(["health"], mockEnv);
      const plain = stripAnsi(stdout + stderr);

      expect(exitCode).toBe(0);
      expect(plain).toContain("Checking provider health");
      expect(plain).toContain("Mock Provider (mock)");
      expect(plain).toContain("Platform healthy");
    },
    TEST_TIMEOUT,
  );

  test(
    "should send SMS with mock provider",
    async () => {
      const { exitCode, stdout, stderr } = await runCli(
        [
          "send",
          "-p",
          "01012345678",
          "-c",
          "SMS",
          "--text",
          "인증번호는 123456 입니다",
          "--variables",
          '{"code":"123456"}',
        ],
        mockEnv,
      );
      const plain = stripAnsi(stdout + stderr);

      expect(exitCode).toBe(0);
      expect(plain).toContain("Message sent successfully");
      expect(plain).toContain("Message ID: mock-");
      expect(plain).toContain("Channel: SMS");
    },
    TEST_TIMEOUT,
  );

  test(
    "should reject ALIMTALK without template",
    async () => {
      const { exitCode } = await runCli(
        ["send", "-p", "01012345678", "-c", "ALIMTALK"],
        mockEnv,
      );
      expect(exitCode).toBe(1);
    },
    TEST_TIMEOUT,
  );

  test(
    "should load provider from plugin manifest env",
    async () => {
      const pluginEnv = {
        ...process.env,
        K_MSG_PROVIDER_PLUGINS: JSON.stringify([
          {
            id: "fixture-plugin",
            module: FIXTURE_PLUGIN_PATH,
            exportName: "FixtureProvider",
            default: true,
            config: {
              id: "fixture-plugin",
              name: "Fixture Plugin",
            },
          },
        ]),
      };

      const { exitCode, stdout, stderr } = await runCli(["info"], pluginEnv);
      const plain = stripAnsi(stdout + stderr);

      expect(exitCode).toBe(0);
      expect(plain).toContain("Providers: fixture-plugin");
      expect(plain).toContain("Runtime Source: plugin-manifest");
    },
    TEST_TIMEOUT,
  );

  test(
    "should round-robin providers during bulk send",
    async () => {
      const pluginEnv = {
        ...process.env,
        K_MSG_PROVIDER_PLUGINS: JSON.stringify({
          defaultProviderId: "rr",
          providers: [
            {
              id: "p1",
              module: FIXTURE_PLUGIN_PATH,
              exportName: "FixtureProvider",
              config: { id: "p1", name: "P1" },
            },
            {
              id: "p2",
              module: FIXTURE_PLUGIN_PATH,
              exportName: "FixtureProvider",
              config: { id: "p2", name: "P2" },
            },
            {
              kind: "router",
              id: "rr",
              strategy: "round_robin",
              providers: ["p1", "p2"],
              default: true,
            },
          ],
        }),
      };

      const phones = "01000000001,01000000002,01000000003,01000000004";
      const { exitCode, stdout, stderr } = await runCli(
        ["bulk-send", "--phones", phones, "-c", "SMS", "--text", "test"],
        pluginEnv,
      );
      const plain = stripAnsi(stdout + stderr);

      expect(exitCode).toBe(0);
      expect(plain).toContain("[p1] 01000000001");
      expect(plain).toContain("[p2] 01000000002");
      expect(plain).toContain("[p1] 01000000003");
      expect(plain).toContain("[p2] 01000000004");
      expect(plain).toContain("Bulk send completed");
    },
    TEST_TIMEOUT,
  );
});
