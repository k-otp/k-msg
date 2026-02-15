import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { KMsgCliConfig } from "./schema";

export function saveKMsgConfig(
  configPath: string,
  config: KMsgCliConfig,
): void {
  const dir = path.dirname(configPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
