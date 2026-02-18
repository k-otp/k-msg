import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";
import typedocEntryPoints from "./typedoc.entrypoints.json";
import syncTypeDocLocales from "./plugins/sync-typedoc-locales.mjs";

export default defineConfig({
  site: "https://k-msg.and.guide",
  integrations: [
    starlight({
      title: "k-msg",
      description: "k-msg documentation",
      locales: {
        ko: {
          label: "한국어",
          lang: "ko",
        },
        en: {
          label: "English",
          lang: "en",
        },
      },
      defaultLocale: "ko",
      plugins: [
        starlightTypeDoc({
          entryPoints: typedocEntryPoints,
          tsconfig: "./typedoc.tsconfig.json",
          output: "api",
          sidebar: {
            label: "API",
          },
          typeDoc: {
            excludePrivate: true,
            excludeProtected: true,
            excludeInternal: true,
            readme: "none",
          },
        }),
        syncTypeDocLocales({
          source: "api",
          locales: ["en", "ko"],
        }),
      ],
      sidebar: [
        "index",
        "cli",
        "snippets",
        {
          label: "가이드",
          translations: {
            ko: "가이드",
            en: "Guides",
          },
          items: [
            "guides/overview",
            {
              label: "Packages",
              translations: {
                ko: "Packages",
                en: "Packages",
              },
              items: [
                "guides/packages",
                "guides/packages/k-msg",
                "guides/packages/analytics",
                "guides/packages/channel",
                "guides/packages/core",
                "guides/packages/messaging",
                "guides/packages/provider",
                "guides/packages/template",
                "guides/packages/webhook",
              ],
            },
            {
              label: "Examples",
              translations: {
                ko: "Examples",
                en: "Examples",
              },
              items: [
                "guides/examples",
                "guides/examples/express-node-send-only",
                "guides/examples/hono-bun-send-only",
                "guides/examples/hono-pages-send-only",
                "guides/examples/hono-pages-tracking-hyperdrive",
                "guides/examples/hono-worker-queue-do",
                "guides/examples/hono-worker-tracking-d1",
              ],
            },
          ],
        },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
