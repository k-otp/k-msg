/**
 * E2E Integration tests for CLI commands
 */

import { describe, expect, test } from "bun:test";
import { KMsg } from "@k-msg/messaging";
import { MockProvider } from "@k-msg/provider";
import { spawn } from "bun";
import path from "path";

const CLI_PATH = path.join(import.meta.dir, "cli.ts");
const TEST_TIMEOUT = 30000;

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

      expect([0, 1]).toContain(exitCode);
      expect(output).toContain("AlimTalk CLI");
      expect(output).toContain("-h, --help");
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

      expect(exitCode).toBe(0);
      expect(output).toContain("0.1.0");
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

      expect(exitCode).toBe(0);
      expect(output).toContain("Platform Information");
      expect(output).toContain("Version:");
      expect(output).toContain("Providers:");
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

      expect(exitCode).toBe(0);
      expect(output).toContain("Checking provider health");
      expect(output).toContain("✅ Provider initialized");
      expect(output).toContain("Mock Provider");
    },
    TEST_TIMEOUT,
  );

  test(
    "should handle message send with mock provider",
    async () => {
      const proc = spawn(
        [
          "bun",
          CLI_PATH,
          "test-send",
          "-t",
          "TEST_TEMPLATE",
          "-p",
          "01012345678",
          "-v",
          '{"name": "Test"}',
        ],
        {
          env: mockEnv,
        },
      );

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      expect(exitCode).toBe(0);
      expect(output).toContain("Testing IWINV message sending");
      expect(output).toContain("✅ Message sent successfully!");
      expect(output).toContain("Message ID: mock-");
    },
    TEST_TIMEOUT,
  );

  test(
    "should list templates using mock provider",
    async () => {
      const proc = spawn(["bun", CLI_PATH, "list-templates"], {
        env: mockEnv,
      });

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      expect(exitCode).toBe(0);
      expect(output).toContain("Fetching templates");
    },
    TEST_TIMEOUT,
  );
});

describe("Core Messaging Flow Integration", () => {
  test("should verify the flow: Command -> Mock Provider -> Success", async () => {
    const mockProvider = new MockProvider();
    const kmsg = new KMsg(mockProvider as any);

    const result = await kmsg.send({
      type: "ALIMTALK",
      to: "01012345678",
      from: "01000000000",
      templateId: "WELCOME",
      variables: { name: "User" },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.messageId).toContain("mock-");
      expect(result.value.status).toBe("SENT");
    }

    expect((mockProvider as any).getHistory().length).toBe(1);
    expect((mockProvider as any).getHistory()[0].to).toBe("01012345678");
  });
});
