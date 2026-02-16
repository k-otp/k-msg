import { beforeAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { expectCommand } from "@bunli/test";

import { createKMsgCli } from "./cli/create";

const CLI_ROOT = path.join(import.meta.dir, "..");
const FIXTURE_CONFIG_URL = new URL(
  "./fixtures/k-msg.config.json",
  import.meta.url,
);
const TEST_TIMEOUT = 30_000;
const DIRECT_AI_ENV_KEYS = new Set(["CLAUDECODE", "CURSOR_AGENT"]);

function isAIEnvKey(key: string): boolean {
  return (
    DIRECT_AI_ENV_KEYS.has(key) ||
    key.startsWith("CODEX_") ||
    key.startsWith("MCP_")
  );
}

let fixtureConfigRaw = "";

beforeAll(async () => {
  fixtureConfigRaw = await Bun.file(FIXTURE_CONFIG_URL).text();
});

function tmpRootDir(): string {
  const fromEnv = Bun.env.TMPDIR ?? Bun.env.TEMP ?? Bun.env.TMP;
  // Fall back to a workspace-local temp dir if temp env vars are missing (rare).
  return fromEnv && fromEnv.trim().length > 0
    ? fromEnv
    : path.join(CLI_ROOT, "dist", ".tmp");
}

async function createTempConfig(): Promise<string> {
  const dir = path.join(tmpRootDir(), `k-msg-cli-${crypto.randomUUID()}`);
  const target = path.join(dir, "k-msg.config.json");
  await Bun.write(target, fixtureConfigRaw);
  return target;
}

async function runCli(
  argv: string[],
  options?: {
    env?: Record<string, string | undefined>;
  },
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  error?: Error;
}> {
  const start = performance.now();
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCodeFromExit: number | undefined;
  let error: Error | undefined;

  const originalLog = console.log;
  const originalError = console.error;
  const originalExit = process.exit;
  const originalCwd = process.cwd();
  const originalEnv = new Map<string, string | undefined>();
  process.exitCode = 0;

  const setEnv = (key: string, value: string | undefined) => {
    if (!originalEnv.has(key)) {
      originalEnv.set(key, process.env[key]);
    }
    if (value === undefined) {
      delete process.env[key];
      return;
    }
    process.env[key] = value;
  };

  for (const key of Object.keys(process.env)) {
    if (isAIEnvKey(key)) {
      setEnv(key, undefined);
    }
  }
  for (const [key, value] of Object.entries(options?.env ?? {})) {
    setEnv(key, value);
  }

  console.log = (...args) => stdout.push(args.join(" "));
  console.error = (...args) => stderr.push(args.join(" "));
  (process as unknown as { exit: (code?: number) => never }).exit = (
    code?: number,
  ): never => {
    exitCodeFromExit = typeof code === "number" ? code : 0;
    throw new Error(`Process exited with code ${exitCodeFromExit}`);
  };

  try {
    process.chdir(CLI_ROOT);

    const cli = await createKMsgCli();

    await cli.run(argv);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (!err.message.startsWith("Process exited with code")) {
      error = err;
      stderr.push(err.message);
      if (exitCodeFromExit === undefined) {
        if (typeof process.exitCode !== "number" || process.exitCode === 0) {
          process.exitCode = 1;
        }
      }
    }
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exit = originalExit;
    process.chdir(originalCwd);
    for (const [key, value] of originalEnv.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  const exitCode =
    exitCodeFromExit ??
    (typeof process.exitCode === "number" ? process.exitCode : 0);

  // Avoid leaking exit codes between runs inside a single Bun test process.
  process.exitCode = 0;

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    exitCode,
    duration: performance.now() - start,
    ...(error ? { error } : {}),
  };
}

describe("k-msg CLI (bunli) E2E", () => {
  test(
    "help/version",
    async () => {
      const help = expectCommand(await runCli(["--help"]));
      help.toHaveExitCode(0);
      expect(help.stdout.toLowerCase()).toContain("k-msg");
      expect(help.stdout).toContain("config");
      expect(help.stdout).toContain("providers");

      const ver = expectCommand(await runCli(["--version"]));
      ver.toHaveExitCode(0);
      expect(ver.stdout).toContain("k-msg v");
    },
    TEST_TIMEOUT,
  );

  test(
    "config validate/show",
    async () => {
      const configPath = await createTempConfig();
      const validated = expectCommand(
        await runCli(["config", "validate", "--config", configPath]),
      );
      validated.toHaveSucceeded();
      expect(validated.stdout).toContain("OK:");

      const shown = expectCommand(
        await runCli(["config", "show", "--config", configPath]),
      );
      shown.toHaveSucceeded();
      expect(shown.stdout).toContain("Config:");
      expect(shown.stdout).toContain("Providers:");
    },
    TEST_TIMEOUT,
  );

  test(
    "providers list/health",
    async () => {
      const configPath = await createTempConfig();

      const listed = expectCommand(
        await runCli(["providers", "list", "--config", configPath]),
      );
      listed.toHaveSucceeded();
      expect(listed.stdout).toContain("mock:");

      const health = expectCommand(
        await runCli(["providers", "health", "--config", configPath]),
      );
      health.toHaveSucceeded();
      expect(health.stdout).toContain("mock");
    },
    TEST_TIMEOUT,
  );

  test(
    "AI env auto-enables JSON output",
    async () => {
      const configPath = await createTempConfig();
      const listed = expectCommand(
        await runCli(["providers", "list", "--config", configPath], {
          env: { CODEX_SHELL: "1" },
        }),
      );
      listed.toHaveSucceeded();
      const parsed = JSON.parse(listed.stdout) as unknown;
      expect(Array.isArray(parsed)).toBe(true);
    },
    TEST_TIMEOUT,
  );

  test(
    "non-agent CODEX env does not force JSON output",
    async () => {
      const configPath = await createTempConfig();
      const listed = expectCommand(
        await runCli(["providers", "list", "--config", configPath], {
          env: { CODEX_HOME: "/tmp/codex-home" },
        }),
      );
      listed.toHaveSucceeded();
      expect(listed.stdout).toContain("mock:");
    },
    TEST_TIMEOUT,
  );

  test(
    "sms/alimtalk/advanced send",
    async () => {
      const configPath = await createTempConfig();

      const smsResult = expectCommand(
        await runCli([
          "sms",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--text",
          "test",
        ]),
      );
      smsResult.toHaveSucceeded();
      expect(smsResult.stdout).toContain("OK");

      const alimtalkResult = expectCommand(
        await runCli([
          "alimtalk",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--template-code",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
        ]),
      );
      alimtalkResult.toHaveSucceeded();
      expect(alimtalkResult.stdout).toContain("OK ALIMTALK");

      const advanced = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"advanced"}',
        ]),
      );
      advanced.toHaveSucceeded();
      expect(advanced.stdout).toContain("OK");
    },
    TEST_TIMEOUT,
  );

  test(
    "kakao channel/template commands",
    async () => {
      const configPath = await createTempConfig();

      const categories = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "categories",
          "--config",
          configPath,
        ]),
      );
      categories.toHaveSucceeded();
      expect(categories.stdout).toContain("first");

      const list = expectCommand(
        await runCli(["kakao", "channel", "list", "--config", configPath]),
      );
      list.toHaveSucceeded();
      expect(list.stdout).toContain("mock-sender-seed");

      const auth = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "auth",
          "--config",
          configPath,
          "--plus-id",
          "@mock",
          "--phone",
          "01012345678",
        ]),
      );
      auth.toHaveSucceeded();
      expect(auth.stdout).toContain("OK");

      const add = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "add",
          "--config",
          configPath,
          "--plus-id",
          "@mock",
          "--auth-num",
          "1234",
          "--phone",
          "01012345678",
          "--category-code",
          "001",
          "--save",
          "test",
        ]),
      );
      add.toHaveSucceeded();
      expect(add.stdout).toContain("saved=test");

      const tplList = expectCommand(
        await runCli(["kakao", "template", "list", "--config", configPath]),
      );
      tplList.toHaveSucceeded();
      expect(tplList.stdout).toContain("MOCK_TPL_SEED");

      const tplGet = expectCommand(
        await runCli([
          "kakao",
          "template",
          "get",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
        ]),
      );
      tplGet.toHaveSucceeded();
      expect(tplGet.stdout).toContain("MOCK_TPL_SEED");

      const tplUpdate = expectCommand(
        await runCli([
          "kakao",
          "template",
          "update",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
          "--name",
          "Updated Name",
        ]),
      );
      tplUpdate.toHaveSucceeded();

      const tplRequest = expectCommand(
        await runCli([
          "kakao",
          "template",
          "request",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
        ]),
      );
      tplRequest.toHaveSucceeded();

      const tplDelete = expectCommand(
        await runCli([
          "kakao",
          "template",
          "delete",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
        ]),
      );
      tplDelete.toHaveSucceeded();
    },
    TEST_TIMEOUT,
  );
});
