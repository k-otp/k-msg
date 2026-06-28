import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

describe("CLI runtime policy", () => {
  test("removes legacy runtime package surfaces from the published CLI package", () => {
    const dependencies = {
      ...(packageManifest.dependencies ?? {}),
      ...(packageManifest.devDependencies ?? {}),
      ...(packageManifest.optionalDependencies ?? {}),
    } as Record<string, string | undefined>;

    expect(dependencies.gunshi).toBe("0.35.1");
    expect(dependencies["@gunshi/plugin-completion"]).toBe("0.35.1");
    expect(dependencies["@bunli/core"]).toBeUndefined();
    expect(dependencies["@bunli/runtime"]).toBeUndefined();
    expect(dependencies["@bunli/tui"]).toBeUndefined();
    expect(dependencies.bunli).toBeUndefined();
    expect(dependencies["@opentui/core-darwin-arm64"]).toBeUndefined();
    expect(fs.existsSync(path.join(packageRoot, "bunli.config.ts"))).toBe(false);
  });
});
