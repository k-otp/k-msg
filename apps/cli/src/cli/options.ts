import { option } from "@bunli/core";
import { z } from "zod";

export const optConfig = option(z.string().optional(), {
  description: "Path to k-msg.config.json (default: ./k-msg.config.json)",
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
