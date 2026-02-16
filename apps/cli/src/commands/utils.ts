import { KMsgError, KMsgErrorCode, type SendWarning } from "k-msg";

export class CapabilityNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapabilityNotSupportedError";
  }
}

export function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(
      `Invalid JSON for ${label}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function parseIsoDate(
  value: string | undefined,
  label: string,
): Date | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${label}: ${value}`);
  }
  return date;
}

export function exitCodeForError(error: unknown): number {
  if (error instanceof CapabilityNotSupportedError) return 4;
  if (error instanceof KMsgError) {
    switch (error.code) {
      case KMsgErrorCode.INVALID_REQUEST:
      case KMsgErrorCode.TEMPLATE_NOT_FOUND:
        return 2;
      default:
        return 3;
    }
  }
  return 2;
}

export function printError(error: unknown, asJson: boolean): void {
  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          error:
            error instanceof CapabilityNotSupportedError
              ? {
                  name: error.name,
                  code: "CAPABILITY_NOT_SUPPORTED",
                  message: error.message,
                }
              : error instanceof KMsgError
                ? error.toJSON()
                : error instanceof Error
                  ? { name: error.name, message: error.message }
                  : { message: String(error) },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (error instanceof CapabilityNotSupportedError) {
    console.error(`CAPABILITY_NOT_SUPPORTED: ${error.message}`);
    return;
  }

  if (error instanceof KMsgError) {
    console.error(`${error.code}: ${error.message}`);
    return;
  }
  console.error(error instanceof Error ? error.message : String(error));
}

export function printWarnings(warnings: SendWarning[] | undefined): void {
  if (!Array.isArray(warnings) || warnings.length === 0) return;

  for (const warning of warnings) {
    const code =
      typeof warning.code === "string" && warning.code.length > 0
        ? warning.code
        : "UNKNOWN_WARNING";
    const message =
      typeof warning.message === "string" && warning.message.length > 0
        ? warning.message
        : code;
    console.log(`WARNING ${code}: ${message}`);
  }
}
