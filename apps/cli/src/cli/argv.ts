const CLI_EMPTY_STRING_SENTINEL = "__KMSG_EMPTY_STRING__";
const PRESERVE_EMPTY_STRING_FLAGS = new Set([
  "--buttons",
  "--content",
  "--name",
]);

export function normalizeExplicitEmptyStringArgs(argv: string[]): string[] {
  const normalized: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    normalized.push(arg);

    if (!PRESERVE_EMPTY_STRING_FLAGS.has(arg)) {
      continue;
    }

    const nextArg = argv[index + 1];
    if (nextArg !== "") {
      continue;
    }

    normalized.push(CLI_EMPTY_STRING_SENTINEL);
    index += 1;
  }

  return normalized;
}

export function restoreExplicitEmptyString(
  value: string | undefined,
): string | undefined {
  if (value === CLI_EMPTY_STRING_SENTINEL) {
    return "";
  }

  return value;
}
