import { cp, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default function syncTypeDocLocales(options = {}) {
  const source = options.source ?? "api";
  const locales = options.locales ?? ["en"];

  return {
    name: "sync-typedoc-locales",
    hooks: {
      async "config:setup"({ astroConfig, logger }) {
        const rootPath = fileURLToPath(astroConfig.root);
        const docsRoot = path.join(rootPath, "src", "content", "docs");
        const sourceDir = path.join(docsRoot, source);

        try {
          await stat(sourceDir);
        } catch {
          logger.warn(`[sync-typedoc-locales] source not found: ${sourceDir}`);
          return;
        }

        for (const locale of locales) {
          const targetDir = path.join(docsRoot, locale, source);
          await rm(targetDir, { recursive: true, force: true });
          await cp(sourceDir, targetDir, { recursive: true, force: true });
        }
      },
    },
  };
}
