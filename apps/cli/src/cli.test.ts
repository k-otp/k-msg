import { beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "bun";

const CLI_ROOT = path.join(import.meta.dir, "..");
const CLI_SRC_PATH = path.join(import.meta.dir, "cli.ts");
const CLI_DIST_PATH = path.join(CLI_ROOT, "dist", "cli.js");
const FIXTURE_CONFIG_PATH = path.join(
  import.meta.dir,
  "fixtures",
  "k-msg.config.json",
);
const TEST_TIMEOUT = 30_000;

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

function createTempConfig(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "k-msg-cli-"));
  const target = path.join(dir, "k-msg.config.json");
  const raw = readFileSync(FIXTURE_CONFIG_PATH, "utf8");
  writeFileSync(target, raw, "utf8");
  return target;
}

describe("k-msg CLI (bunli) E2E", () => {
  beforeAll(async () => {
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
    "help/version",
    async () => {
      const {
        exitCode: helpCode,
        stdout: helpOut,
        stderr: helpErr,
      } = await runCli(["--help"], process.env);
      expect([0, 2]).toContain(helpCode);
      expect((helpOut + helpErr).toLowerCase()).toContain("k-msg");

      const { exitCode: verCode, stdout: verOut } = await runCli(
        ["--version"],
        process.env,
      );
      expect(verCode).toBe(0);
      expect(verOut).toContain("k-msg v");
    },
    TEST_TIMEOUT,
  );

  test(
    "config validate/show",
    async () => {
      const configPath = createTempConfig();
      const { exitCode, stdout } = await runCli(
        ["config", "validate", "--config", configPath],
        process.env,
      );
      expect(exitCode).toBe(0);
      expect(stdout).toContain("OK:");

      const shown = await runCli(
        ["config", "show", "--config", configPath],
        process.env,
      );
      expect(shown.exitCode).toBe(0);
      expect(shown.stdout).toContain("Config:");
      expect(shown.stdout).toContain("Providers:");
    },
    TEST_TIMEOUT,
  );

  test(
    "providers list/health",
    async () => {
      const configPath = createTempConfig();

      const listed = await runCli(
        ["providers", "list", "--config", configPath],
        process.env,
      );
      expect(listed.exitCode).toBe(0);
      expect(listed.stdout).toContain("mock:");

      const health = await runCli(
        ["providers", "health", "--config", configPath],
        process.env,
      );
      expect(health.exitCode).toBe(0);
      expect(health.stdout).toContain("mock");
    },
    TEST_TIMEOUT,
  );

  test(
    "sms/alimtalk/advanced send",
    async () => {
      const configPath = createTempConfig();

      const sms = await runCli(
        [
          "sms",
          "send",
          "--config",
          configPath,
          "--to",
          "01012345678",
          "--text",
          "test",
        ],
        process.env,
      );
      expect(sms.exitCode).toBe(0);
      expect(sms.stdout).toContain("OK");

      const alimtalk = await runCli(
        [
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
        ],
        process.env,
      );
      expect(alimtalk.exitCode).toBe(0);
      expect(alimtalk.stdout).toContain("OK ALIMTALK");

      const advanced = await runCli(
        [
          "send",
          "--config",
          configPath,
          "--input",
          '{"to":"01012345678","text":"advanced"}',
        ],
        process.env,
      );
      expect(advanced.exitCode).toBe(0);
      expect(advanced.stdout).toContain("OK");
    },
    TEST_TIMEOUT,
  );

  test(
    "kakao channel/template commands",
    async () => {
      const configPath = createTempConfig();

      const categories = await runCli(
        ["kakao", "channel", "categories", "--config", configPath],
        process.env,
      );
      expect(categories.exitCode).toBe(0);
      expect(categories.stdout).toContain("first");

      const list = await runCli(
        ["kakao", "channel", "list", "--config", configPath],
        process.env,
      );
      expect(list.exitCode).toBe(0);
      expect(list.stdout).toContain("mock-sender-seed");

      const auth = await runCli(
        [
          "kakao",
          "channel",
          "auth",
          "--config",
          configPath,
          "--plus-id",
          "@mock",
          "--phone",
          "01012345678",
        ],
        process.env,
      );
      expect(auth.exitCode).toBe(0);
      expect(auth.stdout).toContain("OK");

      const add = await runCli(
        [
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
        ],
        process.env,
      );
      expect(add.exitCode).toBe(0);
      expect(add.stdout).toContain("saved=test");

      const tplList = await runCli(
        ["kakao", "template", "list", "--config", configPath],
        process.env,
      );
      expect(tplList.exitCode).toBe(0);
      expect(tplList.stdout).toContain("MOCK_TPL_SEED");

      const tplGet = await runCli(
        [
          "kakao",
          "template",
          "get",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
        ],
        process.env,
      );
      expect(tplGet.exitCode).toBe(0);
      expect(tplGet.stdout).toContain("MOCK_TPL_SEED");

      const tplUpdate = await runCli(
        [
          "kakao",
          "template",
          "update",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
          "--name",
          "Updated Name",
        ],
        process.env,
      );
      expect(tplUpdate.exitCode).toBe(0);

      const tplRequest = await runCli(
        [
          "kakao",
          "template",
          "request",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
        ],
        process.env,
      );
      expect(tplRequest.exitCode).toBe(0);

      const tplDelete = await runCli(
        [
          "kakao",
          "template",
          "delete",
          "--config",
          configPath,
          "--template-code",
          "MOCK_TPL_SEED",
        ],
        process.env,
      );
      expect(tplDelete.exitCode).toBe(0);
    },
    TEST_TIMEOUT,
  );
});
