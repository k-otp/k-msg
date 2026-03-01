import { beforeAll, describe, expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
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

async function createTempConfigFromObject(value: unknown): Promise<string> {
  const dir = path.join(tmpRootDir(), `k-msg-cli-${crypto.randomUUID()}`);
  const target = path.join(dir, "k-msg.config.json");
  await Bun.write(target, JSON.stringify(value, null, 2));
  return target;
}

async function createTempCwd(): Promise<string> {
  const dir = path.join(tmpRootDir(), `k-msg-cli-cwd-${crypto.randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

async function createTempConfigPath(): Promise<string> {
  const dir = path.join(
    tmpRootDir(),
    `k-msg-cli-config-${crypto.randomUUID()}`,
  );
  await mkdir(dir, { recursive: true });
  return path.join(dir, "k-msg.config.json");
}

async function runCli(
  argv: string[],
  options?: {
    env?: Record<string, string | undefined>;
    cwd?: string;
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
    process.chdir(options?.cwd ?? CLI_ROOT);

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
  const normalizedExitCode = exitCode === 1 ? 2 : exitCode;

  // Avoid leaking exit codes between runs inside a single Bun test process.
  process.exitCode = 0;

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    exitCode: normalizedExitCode,
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
      expect(help.stdout).toContain("db");
      expect(help.stdout).toContain("providers");

      const ver = expectCommand(await runCli(["--version"]));
      ver.toHaveExitCode(0);
      expect(ver.stdout).toContain("k-msg v");
    },
    TEST_TIMEOUT,
  );

  test(
    "db schema print validates required dialect",
    async () => {
      const printed = expectCommand(await runCli(["db", "schema", "print"]));
      printed.toHaveExitCode(2);
    },
    TEST_TIMEOUT,
  );

  test(
    "db schema print supports format/target combinations",
    async () => {
      const sqlOnly = expectCommand(
        await runCli([
          "db",
          "schema",
          "print",
          "--dialect",
          "postgres",
          "--target",
          "tracking",
          "--format",
          "sql",
        ]),
      );
      sqlOnly.toHaveSucceeded();
      expect(sqlOnly.stdout).toContain("kmsg_delivery_tracking");
      expect(sqlOnly.stdout).not.toContain("kmsg_jobs");

      const drizzleOnly = expectCommand(
        await runCli([
          "db",
          "schema",
          "print",
          "--dialect",
          "mysql",
          "--target",
          "queue",
          "--format",
          "drizzle",
        ]),
      );
      drizzleOnly.toHaveSucceeded();
      expect(drizzleOnly.stdout).toContain("drizzle-orm/mysql-core");
      expect(drizzleOnly.stdout).toContain("jobQueueTable");
      expect(drizzleOnly.stdout).not.toContain("deliveryTrackingTable");
    },
    TEST_TIMEOUT,
  );

  test(
    "db schema generate writes files and enforces --force policy",
    async () => {
      const outDir = await createTempCwd();

      const first = expectCommand(
        await runCli([
          "db",
          "schema",
          "generate",
          "--dialect",
          "sqlite",
          "--out-dir",
          outDir,
        ]),
      );
      first.toHaveSucceeded();

      const drizzlePath = path.join(outDir, "kmsg.schema.ts");
      const sqlPath = path.join(outDir, "kmsg.schema.sql");
      expect(await Bun.file(drizzlePath).exists()).toBe(true);
      expect(await Bun.file(sqlPath).exists()).toBe(true);

      const second = expectCommand(
        await runCli([
          "db",
          "schema",
          "generate",
          "--dialect",
          "sqlite",
          "--out-dir",
          outDir,
        ]),
      );
      second.toHaveExitCode(2);
      expect(second.stderr).toContain("already exists");

      const third = expectCommand(
        await runCli([
          "db",
          "schema",
          "generate",
          "--dialect",
          "sqlite",
          "--out-dir",
          outDir,
          "--force",
          "true",
        ]),
      );
      third.toHaveSucceeded();
    },
    TEST_TIMEOUT,
  );

  test(
    "db schema generate supports tracking/queue target selection",
    async () => {
      const trackingDir = await createTempCwd();
      const queueDir = await createTempCwd();

      const trackingGenerated = expectCommand(
        await runCli([
          "db",
          "schema",
          "generate",
          "--dialect",
          "postgres",
          "--target",
          "tracking",
          "--format",
          "sql",
          "--out-dir",
          trackingDir,
          "--sql-file",
          "tracking.sql",
        ]),
      );
      trackingGenerated.toHaveSucceeded();

      const queueGenerated = expectCommand(
        await runCli([
          "db",
          "schema",
          "generate",
          "--dialect",
          "postgres",
          "--target",
          "queue",
          "--format",
          "sql",
          "--out-dir",
          queueDir,
          "--sql-file",
          "queue.sql",
        ]),
      );
      queueGenerated.toHaveSucceeded();

      const trackingSql = await Bun.file(
        path.join(trackingDir, "tracking.sql"),
      ).text();
      expect(trackingSql).toContain("kmsg_delivery_tracking");
      expect(trackingSql).not.toContain("kmsg_jobs");

      const queueSql = await Bun.file(path.join(queueDir, "queue.sql")).text();
      expect(queueSql).toContain("kmsg_jobs");
      expect(queueSql).not.toContain("kmsg_delivery_tracking");
    },
    TEST_TIMEOUT,
  );

  test(
    "runs from cwd without bunli config",
    async () => {
      const cwd = await createTempCwd();
      const help = expectCommand(await runCli(["--help"], { cwd }));
      help.toHaveExitCode(0);
      expect(help.stdout.toLowerCase()).toContain("k-msg");
    },
    TEST_TIMEOUT,
  );

  test(
    "completions work outside project cwd",
    async () => {
      const cwd = await createTempCwd();

      const script = expectCommand(
        await runCli(["completions", "zsh"], { cwd }),
      );
      script.toHaveSucceeded();
      expect(script.stdout).toContain("# zsh completion for k-msg");

      const protocol = expectCommand(
        await runCli(["complete", "--", ""], { cwd }),
      );
      protocol.toHaveSucceeded();
      expect(protocol.stdout).not.toContain(":1");
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
    "config init uses full template in non-interactive mode",
    async () => {
      const targetPath = await createTempConfigPath();
      const initialized = expectCommand(
        await runCli(["config", "init", "--config", targetPath]),
      );
      initialized.toHaveSucceeded();
      expect(initialized.stdout).toContain(targetPath);

      const parsed = JSON.parse(await Bun.file(targetPath).text()) as Record<
        string,
        unknown
      >;
      expect(parsed.$schema).toBe(
        "https://raw.githubusercontent.com/k-otp/k-msg/main/apps/cli/schemas/k-msg.config.schema.json",
      );
      expect(Array.isArray(parsed.providers)).toBe(true);
      expect((parsed.providers as unknown[]).length).toBeGreaterThan(0);
      const defaults = parsed.defaults as Record<string, unknown> | undefined;
      expect(defaults?.from).toBeUndefined();
    },
    TEST_TIMEOUT,
  );

  test(
    "config provider add requires interactive terminal",
    async () => {
      const targetPath = await createTempConfigPath();
      const added = expectCommand(
        await runCli(["config", "provider", "add", "--config", targetPath]),
      );
      added.toHaveExitCode(2);
      expect(added.stderr).toContain("requires an interactive terminal");
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
    "providers doctor / alimtalk preflight",
    async () => {
      const configPath = await createTempConfig();

      const doctor = expectCommand(
        await runCli(["providers", "doctor", "--config", configPath]),
      );
      doctor.toHaveSucceeded();
      expect(doctor.stdout).toContain("mock");

      const preflight = expectCommand(
        await runCli([
          "alimtalk",
          "preflight",
          "--config",
          configPath,
          "--template-id",
          "MOCK_TPL_SEED",
          "--channel",
          "seed",
        ]),
      );
      preflight.toHaveSucceeded();
      expect(preflight.stdout).toContain("preflight");
      expect(preflight.stdout).toContain("template_exists_probe");
    },
    TEST_TIMEOUT,
  );

  test(
    "providers doctor warns when SMS/LMS sender config is missing",
    async () => {
      const configPath = await createTempConfigFromObject({
        version: 1,
        providers: [
          {
            type: "iwinv",
            id: "iwinv",
            config: {
              apiKey: "api-key",
            },
          },
        ],
        routing: { defaultProviderId: "iwinv", strategy: "first" },
        onboarding: {
          manualChecks: {
            iwinv: {
              channel_registered_in_console: {
                done: true,
              },
            },
          },
        },
      });

      const doctor = expectCommand(
        await runCli(["providers", "doctor", "--config", configPath]),
      );
      doctor.toHaveSucceeded();
      expect(doctor.stdout).toContain("sms_lms_sender_config");
      expect(doctor.stdout).toContain(
        "SMS/LMS sender is not configured (set iwinv.config.senderNumber or iwinv.config.smsSenderNumber)",
      );
    },
    TEST_TIMEOUT,
  );

  test(
    "alimtalk preflight fails when manual prerequisite is not acknowledged",
    async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () =>
        new Response(
          JSON.stringify({
            code: 200,
            message: "ok",
            totalCount: 1,
            list: [
              {
                templateId: "TPL_1",
                templateName: "name",
                templateContent: "content",
                status: "Y",
                createDate: "2026-02-16 10:00:00",
              },
            ],
          }),
          { status: 200 },
        )) as unknown as typeof fetch;

      try {
        const configPath = await createTempConfigFromObject({
          version: 1,
          providers: [
            {
              type: "iwinv",
              id: "iwinv",
              config: {
                apiKey: "api-key",
              },
            },
          ],
          routing: { defaultProviderId: "iwinv", strategy: "first" },
          onboarding: {
            manualChecks: {
              iwinv: {
                channel_registered_in_console: {
                  done: false,
                },
              },
            },
          },
        });

        const preflight = expectCommand(
          await runCli([
            "alimtalk",
            "preflight",
            "--config",
            configPath,
            "--provider",
            "iwinv",
            "--template-id",
            "TPL_1",
          ]),
        );
        preflight.toHaveExitCode(2);
        expect(preflight.stdout).toContain("channel_registered_in_console");
      } finally {
        globalThis.fetch = originalFetch;
      }
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
          "--template-id",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
        ]),
      );
      alimtalkResult.toHaveSucceeded();
      expect(alimtalkResult.stdout).toContain("OK ALIMTALK");

      const alimtalkFailover = expectCommand(
        await runCli([
          "alimtalk",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--template-id",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
          "--failover",
          "true",
          "--fallback-content",
          "fallback text",
        ]),
      );
      alimtalkFailover.toHaveSucceeded();
      expect(alimtalkFailover.stdout).toContain(
        "WARNING FAILOVER_UNSUPPORTED_PROVIDER",
      );

      const alimtalkFailoverJson = expectCommand(
        await runCli([
          "alimtalk",
          "send",
          "--config",
          configPath,
          "--json",
          "true",
          "--to",
          "01012345678",
          "--template-id",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
          "--failover",
          "true",
          "--fallback-content",
          "fallback text",
        ]),
      );
      alimtalkFailoverJson.toHaveSucceeded();
      const failoverJsonParsed = JSON.parse(
        alimtalkFailoverJson.stdout,
      ) as Record<string, unknown>;
      const failoverJsonResult = failoverJsonParsed.result as Record<
        string,
        unknown
      >;
      const warnings = failoverJsonResult.warnings as Array<
        Record<string, unknown>
      >;
      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings[0]?.code).toBe("FAILOVER_UNSUPPORTED_PROVIDER");

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

      const dryRunSingle = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"dry-run-single"}',
          "--dry-run",
          "true",
        ]),
      );
      dryRunSingle.toHaveSucceeded();
      expect(dryRunSingle.stdout).toContain("DRY RUN");
      expect(dryRunSingle.stdout).toContain("Preview: single");

      const dryRunBatchJson = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '[{"to":"01012345678","text":"dry-run-1"},{"to":"01099998888","text":"dry-run-2"}]',
          "--dry-run",
          "true",
          "--json",
          "true",
        ]),
      );
      dryRunBatchJson.toHaveSucceeded();
      const dryRunBatchParsed = JSON.parse(dryRunBatchJson.stdout) as Record<
        string,
        unknown
      >;
      expect(dryRunBatchParsed.ok).toBe(true);
      expect(dryRunBatchParsed.dryRun).toBe(true);
      const dryRunSummary = dryRunBatchParsed.summary as Record<
        string,
        unknown
      >;
      expect(dryRunSummary.total).toBe(2);
    },
    TEST_TIMEOUT,
  );

  test(
    "boolean flag truth table",
    async () => {
      const configPath = await createTempConfig();

      const dryRunPresence = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"truth-table"}',
          "--dry-run",
        ]),
      );
      dryRunPresence.toHaveSucceeded();
      expect(dryRunPresence.stdout).toContain("DRY RUN");

      const dryRunTrue = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"truth-table"}',
          "--dry-run",
          "true",
        ]),
      );
      dryRunTrue.toHaveSucceeded();
      expect(dryRunTrue.stdout).toContain("DRY RUN");

      const dryRunFalse = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"truth-table"}',
          "--dry-run",
          "false",
        ]),
      );
      dryRunFalse.toHaveSucceeded();
      expect(dryRunFalse.stdout).toContain("OK");

      const dryRunInvalid = expectCommand(
        await runCli([
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"truth-table"}',
          "--dry-run",
          "maybe",
        ]),
      );
      dryRunInvalid.toHaveExitCode(2);
      expect(`${dryRunInvalid.stdout}\n${dryRunInvalid.stderr}`).toContain(
        "Invalid option 'dry-run'",
      );

      const jsonPresence = expectCommand(
        await runCli(["providers", "list", "--config", configPath, "--json"]),
      );
      jsonPresence.toHaveSucceeded();
      expect(Array.isArray(JSON.parse(jsonPresence.stdout))).toBe(true);

      const jsonFalse = expectCommand(
        await runCli([
          "providers",
          "list",
          "--config",
          configPath,
          "--json",
          "false",
        ]),
      );
      jsonFalse.toHaveSucceeded();
      expect(jsonFalse.stdout).toContain("mock:");

      const jsonFalseOverridesAgentEnv = expectCommand(
        await runCli(
          ["providers", "list", "--config", configPath, "--json", "false"],
          {
            env: { CODEX_SHELL: "1" },
          },
        ),
      );
      jsonFalseOverridesAgentEnv.toHaveSucceeded();
      expect(jsonFalseOverridesAgentEnv.stdout).toContain("mock:");

      const failoverPresence = expectCommand(
        await runCli([
          "alimtalk",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--template-id",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
          "--failover",
          "--fallback-content",
          "fallback text",
        ]),
      );
      failoverPresence.toHaveSucceeded();
      expect(failoverPresence.stdout).toContain(
        "WARNING FAILOVER_UNSUPPORTED_PROVIDER",
      );

      const failoverFalse = expectCommand(
        await runCli([
          "alimtalk",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--template-id",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
          "--failover",
          "false",
        ]),
      );
      failoverFalse.toHaveSucceeded();
      expect(failoverFalse.stdout).not.toContain("WARNING");

      const failoverInvalid = expectCommand(
        await runCli([
          "alimtalk",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--template-id",
          "MOCK_TPL_SEED",
          "--vars",
          '{"name":"Jane"}',
          "--failover",
          "maybe",
        ]),
      );
      failoverInvalid.toHaveExitCode(2);
      expect(`${failoverInvalid.stdout}\n${failoverInvalid.stderr}`).toContain(
        "Invalid option 'failover'",
      );

      const configPathForForce = await createTempConfigPath();
      const firstInit = expectCommand(
        await runCli(["config", "init", "--config", configPathForForce]),
      );
      firstInit.toHaveSucceeded();

      const forcePresence = expectCommand(
        await runCli([
          "config",
          "init",
          "--config",
          configPathForForce,
          "--force",
        ]),
      );
      forcePresence.toHaveSucceeded();

      const forceFalse = expectCommand(
        await runCli([
          "config",
          "init",
          "--config",
          configPathForForce,
          "--force",
          "false",
        ]),
      );
      forceFalse.toHaveExitCode(2);
      expect(forceFalse.stderr).toContain("Config already exists");

      const forceTrue = expectCommand(
        await runCli([
          "config",
          "init",
          "--config",
          configPathForForce,
          "--force",
          "true",
        ]),
      );
      forceTrue.toHaveSucceeded();

      const forceInvalid = expectCommand(
        await runCli([
          "config",
          "init",
          "--config",
          configPathForForce,
          "--force",
          "maybe",
        ]),
      );
      forceInvalid.toHaveExitCode(2);
      expect(`${forceInvalid.stdout}\n${forceInvalid.stderr}`).toContain(
        "Invalid option 'force'",
      );
    },
    TEST_TIMEOUT,
  );

  test(
    "providers balance error JSON uses KMsgError details contract",
    async () => {
      const configPath = await createTempConfigFromObject({
        version: 1,
        providers: [
          {
            type: "iwinv",
            id: "iwinv",
            config: {
              apiKey: "api-key",
            },
          },
        ],
        routing: { defaultProviderId: "iwinv", strategy: "first" },
      });

      const balanceJson = expectCommand(
        await runCli([
          "providers",
          "balance",
          "--config",
          configPath,
          "--provider",
          "iwinv",
          "--channel",
          "SMS",
          "--json",
          "true",
        ]),
      );
      balanceJson.toHaveExitCode(3);
      const parsed = JSON.parse(balanceJson.stdout) as Array<
        Record<string, unknown>
      >;
      expect(parsed.length).toBe(1);
      const first = parsed[0];
      const error = first?.error as Record<string, unknown> | undefined;
      expect(error?.code).toBe("INVALID_REQUEST");
      expect(typeof error?.message).toBe("string");
      expect((error?.details as Record<string, unknown>)?.providerId).toBe(
        "iwinv",
      );
      expect(error?.context).toBeUndefined();

      const balanceText = expectCommand(
        await runCli([
          "providers",
          "balance",
          "--config",
          configPath,
          "--provider",
          "iwinv",
          "--channel",
          "SMS",
        ]),
      );
      balanceText.toHaveExitCode(3);
      expect(balanceText.stdout).toContain("FAIL iwinv:");
    },
    TEST_TIMEOUT,
  );

  test(
    "kakao channel binding/api + template commands",
    async () => {
      const configPath = await createTempConfig();

      const bindingList = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "binding",
          "list",
          "--config",
          configPath,
        ]),
      );
      bindingList.toHaveSucceeded();
      expect(bindingList.stdout).toContain("mock-sender-seed");
      expect(bindingList.stdout).toContain("source=config");

      const bindingResolve = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "binding",
          "resolve",
          "--config",
          configPath,
          "--channel",
          "seed",
        ]),
      );
      bindingResolve.toHaveSucceeded();
      expect(bindingResolve.stdout).toContain("senderKey=mock-sender-seed");

      const bindingSet = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "binding",
          "set",
          "--config",
          configPath,
          "--alias",
          "ops",
          "--provider",
          "mock",
          "--sender-key",
          "mock-sender-ops",
          "--plus-id",
          "@ops",
        ]),
      );
      bindingSet.toHaveSucceeded();
      expect(bindingSet.stdout).toContain("OK alias=ops");

      const categories = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "api",
          "categories",
          "--config",
          configPath,
        ]),
      );
      categories.toHaveSucceeded();
      expect(categories.stdout).toContain("first");

      const list = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "api",
          "list",
          "--config",
          configPath,
        ]),
      );
      list.toHaveSucceeded();
      expect(list.stdout).toContain("mock-sender-seed");

      const auth = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "api",
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
          "api",
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

      const removedList = expectCommand(
        await runCli(["kakao", "channel", "list", "--config", configPath]),
      );
      removedList.toHaveExitCode(2);
      expect(removedList.stderr).toContain("was removed");
      expect(removedList.stderr).toContain("binding list");

      const bindingDelete = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "binding",
          "delete",
          "--config",
          configPath,
          "--alias",
          "ops",
        ]),
      );
      bindingDelete.toHaveSucceeded();
      expect(bindingDelete.stdout).toContain("OK alias=ops");

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
          "--template-id",
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
          "--template-id",
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
          "--template-id",
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
          "--template-id",
          "MOCK_TPL_SEED",
        ]),
      );
      tplDelete.toHaveSucceeded();
    },
    TEST_TIMEOUT,
  );

  test(
    "kakao template create/update validates content and buttons before provider call",
    async () => {
      const configPath = await createTempConfig();

      const invalidButtons = expectCommand(
        await runCli([
          "kakao",
          "template",
          "create",
          "--config",
          configPath,
          "--name",
          "템플릿",
          "--content",
          "내용",
          "--buttons",
          '{"type":"WL"}',
        ]),
      );
      invalidButtons.toHaveExitCode(2);
      expect(invalidButtons.stderr).toContain("buttons must be a JSON array");

      const invalidContent = expectCommand(
        await runCli([
          "kakao",
          "template",
          "update",
          "--config",
          configPath,
          "--template-id",
          "MOCK_TPL_SEED",
          "--content",
          "",
        ]),
      );
      invalidContent.toHaveExitCode(2);
      expect(invalidContent.stderr).toContain(
        "content must be a non-empty string",
      );
    },
    TEST_TIMEOUT,
  );

  test(
    "kakao channel api reports unsupported providers (manual/none)",
    async () => {
      const iwinvConfigPath = await createTempConfigFromObject({
        version: 1,
        providers: [
          {
            type: "iwinv",
            id: "iwinv-main",
            config: {
              apiKey: "api-key",
            },
          },
        ],
        routing: { defaultProviderId: "iwinv-main", strategy: "first" },
      });

      const iwinvApi = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "api",
          "list",
          "--config",
          iwinvConfigPath,
          "--provider",
          "iwinv-main",
        ]),
      );
      iwinvApi.toHaveExitCode(2);
      expect(iwinvApi.stderr).toContain("manual Kakao channel onboarding");

      const solapiConfigPath = await createTempConfigFromObject({
        version: 1,
        providers: [
          {
            type: "solapi",
            id: "solapi-main",
            config: {
              apiKey: "solapi-key",
              apiSecret: "solapi-secret",
              kakaoPfId: "pf-main",
            },
          },
        ],
        routing: { defaultProviderId: "solapi-main", strategy: "first" },
      });

      const solapiApi = expectCommand(
        await runCli([
          "kakao",
          "channel",
          "api",
          "list",
          "--config",
          solapiConfigPath,
          "--provider",
          "solapi-main",
        ]),
      );
      solapiApi.toHaveExitCode(2);
      expect(solapiApi.stderr).toContain(
        "does not expose Kakao channel onboarding API",
      );
    },
    TEST_TIMEOUT,
  );
});
