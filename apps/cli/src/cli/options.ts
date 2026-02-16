import { option } from "@bunli/core";
import { z } from "zod";

export const optConfig = option(z.string().optional(), {
  description:
    "Path to k-msg config (default: $XDG_CONFIG_HOME/k-msg/k-msg.config.json or %APPDATA%\\k-msg\\k-msg.config.json; fallback: ./k-msg.config.json)",
});

export const optJson = option(z.coerce.boolean().default(false), {
  description: "Output JSON",
});

export const optVerbose = option(z.coerce.boolean().default(false), {
  description: "Verbose logging",
});

export const optProvider = option(z.string().optional(), {
  description: "Provider id override",
});
