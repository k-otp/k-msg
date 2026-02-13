/**
 * E2E Integration tests for CLI commands
 */

import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import path from "path";

const CLI_PATH = path.join(import.meta.dir, "cli.ts");
const FIXTURE_PLUGIN_PATH = path.join(
  import.meta.dir,
  "fixtures",
  "mock-provider.plugin.ts",
);
const TEST_TIMEOUT = 30000;
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, "");
}

describe("CLI E2E Tests", () => {
  const mockEnv = {
    ...process.env,
    K_MSG_MOCK: "true",
  };

  test(
    "should show help",
    async () => {
      const proc = spawn(["bun", CLI_PATH, "--help"], {
        env: mockEnv,
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

      expect([0, 1]).toContain(exitCode);
      expect(plain).toContain("K-Message CLI");
      expect(plain).toContain("-h, --help");
    },
    TEST_TIMEOUT,
  );

  test(
    "should show version",
    async () => {
      const proc = spawn(["bun", CLI_PATH, "--version"], {
        env: mockEnv,
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

      expect(exitCode).toBe(0);
      expect(plain).toContain("0.2.0");
    },
    TEST_TIMEOUT,
  );

  test(
    "should show info",
    async () => {
      const proc = spawn(["bun", CLI_PATH, "info"], {
        env: mockEnv,
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

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
      const proc = spawn(["bun", CLI_PATH, "health"], {
        env: mockEnv,
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

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
      const proc = spawn(
        [
          "bun",
          CLI_PATH,
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
        {
          env: mockEnv,
        },
      );

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

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
      const proc = spawn(
        ["bun", CLI_PATH, "send", "-p", "01012345678", "-c", "ALIMTALK"],
        {
          env: mockEnv,
        },
      );

      const exitCode = await proc.exited;
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

      const proc = spawn(["bun", CLI_PATH, "info"], {
        env: pluginEnv,
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

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
      const proc = spawn(
        ["bun", CLI_PATH, "bulk-send", "--phones", phones, "-c", "SMS", "--text", "test"],
        {
          env: pluginEnv,
        },
      );

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;
      const plain = stripAnsi(output);

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
