import { option } from "@bunli/core";
import { z } from "zod";

const strictBooleanInput = z.union([
  z.boolean(),
  z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(["true", "false"]))
    .transform((value) => value === "true"),
]);

export const strictBooleanFlagSchema = strictBooleanInput.default(false);
export const strictBooleanOptionalFlagSchema = strictBooleanInput.optional();

export const optConfig = option(z.string().optional(), {
  description:
    "Path to k-msg config (default: $XDG_CONFIG_HOME/k-msg/k-msg.config.json or %APPDATA%\\k-msg\\k-msg.config.json; fallback: ./k-msg.config.json)",
});

export const optJson = option(strictBooleanOptionalFlagSchema, {
  description:
    "Output JSON (boolean: --json, --json true|false, --no-json; default: false)",
});

export const optVerbose = option(strictBooleanFlagSchema, {
  description:
    "Verbose logging (boolean: --verbose, --verbose true|false, --no-verbose; default: false)",
});

export const optProvider = option(z.string().optional(), {
  description: "Provider id override",
});
