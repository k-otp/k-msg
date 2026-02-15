import { defineConfig } from "@bunli/core";

import pkg from "./package.json";

export default defineConfig({
  name: "k-msg",
  version: typeof pkg.version === "string" ? pkg.version : "0.0.0",
  description: "k-msg CLI",
  build: {
    entry: "./src/k-msg.ts",
    outdir: "./dist",
    // When building multi-target binaries (e.g. `--targets all` in CI),
    // bundle each target directory as `<target>.tar.gz` and clean up the folders.
    compress: true,
  },
});
