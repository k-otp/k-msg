import type { KMsgCliConfig } from "./schema";

export async function saveKMsgConfig(
  configPath: string,
  config: KMsgCliConfig,
): Promise<void> {
  // Bun.write creates parent directories recursively.
  await Bun.write(configPath, `${JSON.stringify(config, null, 2)}\n`);
}
