type Level = "info" | "warn" | "error";

/**
 * Writes one JSON line, so Workers Logs can filter by field. Callers must not
 * pass secrets or whole phone numbers.
 */
export function log(
  level: Level,
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({ level, message, ...fields });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function errorFields(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { errorName: error.name, error: error.message };
  }
  return { error: String(error) };
}
