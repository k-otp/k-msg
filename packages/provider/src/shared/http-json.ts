import { isObjectRecord } from "./type-guards";

export function safeParseJson(text: string): unknown {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function toRecordOrFallback(
  parsed: unknown,
  fallback: Record<string, unknown>,
): Record<string, unknown> {
  return isObjectRecord(parsed) ? parsed : fallback;
}
