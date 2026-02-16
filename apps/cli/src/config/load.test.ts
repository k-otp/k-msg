import { describe, expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  resolveConfigPathForRead,
  resolveConfigPathForWrite,
  resolveDefaultConfigPath,
  resolveLegacyCwdConfigPath,
} from "./load";

function tmpRootDir(): string {
  const fromEnv = Bun.env.TMPDIR ?? Bun.env.TEMP ?? Bun.env.TMP;
  return fromEnv && fromEnv.trim().length > 0
    ? fromEnv
    : path.resolve("./dist/.tmp");
}

async function makeTempDirs(): Promise<{ homeDir: string; cwd: string }> {
  const root = path.join(tmpRootDir(), `k-msg-cli-load-${crypto.randomUUID()}`);
  const homeDir = path.join(root, "home");
  const cwd = path.join(root, "cwd");
  await mkdir(homeDir, { recursive: true });
  await mkdir(cwd, { recursive: true });
  return { homeDir, cwd };
}

describe("config path resolution", () => {
  test("prefers home config path when it exists", async () => {
    const { homeDir, cwd } = await makeTempDirs();

    const homePath = resolveDefaultConfigPath({
      platform: "darwin",
      env: {},
      homeDir,
      cwd,
    });
    const legacyPath = resolveLegacyCwdConfigPath({
      platform: "darwin",
      env: {},
      homeDir,
      cwd,
    });

    await Bun.write(homePath, "{}\n");
    await Bun.write(legacyPath, "{}\n");

    const resolved = await resolveConfigPathForRead(undefined, {
      platform: "darwin",
      env: {},
      homeDir,
      cwd,
    });

    expect(resolved).toBe(homePath);
  });

  test("falls back to cwd config path when home config file is missing", async () => {
    const { homeDir, cwd } = await makeTempDirs();

    const legacyPath = resolveLegacyCwdConfigPath({
      platform: "linux",
      env: {},
      homeDir,
      cwd,
    });

    await Bun.write(legacyPath, "{}\n");

    const resolvedRead = await resolveConfigPathForRead(undefined, {
      platform: "linux",
      env: {},
      homeDir,
      cwd,
    });

    const resolvedWrite = await resolveConfigPathForWrite(undefined, {
      platform: "linux",
      env: {},
      homeDir,
      cwd,
    });

    expect(resolvedRead).toBe(legacyPath);
    expect(resolvedWrite).toBe(legacyPath);
  });

  test("returns home path when neither home nor cwd config exists", async () => {
    const { homeDir, cwd } = await makeTempDirs();

    const expected = resolveDefaultConfigPath({
      platform: "linux",
      env: {},
      homeDir,
      cwd,
    });

    const resolved = await resolveConfigPathForRead(undefined, {
      platform: "linux",
      env: {},
      homeDir,
      cwd,
    });

    expect(resolved).toBe(expected);
  });

  test("uses APPDATA on Windows and XDG_CONFIG_HOME on Linux", () => {
    const windowsPath = resolveDefaultConfigPath({
      platform: "win32",
      env: {
        APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
      },
      homeDir: "C:\\Users\\tester",
      cwd: "C:\\workspace",
    });

    const linuxPath = resolveDefaultConfigPath({
      platform: "linux",
      env: {
        XDG_CONFIG_HOME: "/tmp/xdg-config",
      },
      homeDir: "/tmp/home",
      cwd: "/tmp/cwd",
    });

    expect(windowsPath).toContain("AppData");
    expect(windowsPath).toContain("k-msg.config.json");
    expect(linuxPath).toBe("/tmp/xdg-config/k-msg/k-msg.config.json");
  });
});
