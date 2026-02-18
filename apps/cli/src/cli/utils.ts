import { KMsgError, KMsgErrorCode, type SendWarning } from "@k-msg/core";

type AIContext = {
  env?: {
    isAIAgent?: boolean;
  };
  store?: {
    isAIAgent?: boolean;
  };
};

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

export function shouldUseJsonOutput(
  explicitJsonFlag: boolean | undefined,
  context?: AIContext,
): boolean {
  if (explicitJsonFlag === true) {
    return true;
  }
  return context?.env?.isAIAgent === true || context?.store?.isAIAgent === true;
}

export function printError(error: unknown, asJson: boolean): void {
  const hint = getErrorHint(error);

  if (asJson) {
    const errorPayload =
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
            : { message: String(error) };

    console.log(
      JSON.stringify(
        {
          ok: false,
          error: errorPayload,
          ...(hint ? { hint } : {}),
        },
        null,
        2,
      ),
    );
    return;
  }

  if (error instanceof CapabilityNotSupportedError) {
    console.error(`CAPABILITY_NOT_SUPPORTED: ${error.message}`);
    if (hint) console.error(`Try: ${hint}`);
    return;
  }

  if (error instanceof KMsgError) {
    console.error(`${error.code}: ${error.message}`);
    if (hint) console.error(`Try: ${hint}`);
    return;
  }
  console.error(error instanceof Error ? error.message : String(error));
}

function getErrorHint(error: unknown): string | undefined {
  if (error instanceof CapabilityNotSupportedError) {
    return "run `k-msg providers list` to check available capabilities, then `k-msg providers doctor` for diagnostics";
  }

  if (error instanceof KMsgError) {
    switch (error.code) {
      case KMsgErrorCode.INVALID_REQUEST:
        return "check your input JSON shape/required fields, then run `k-msg providers doctor`";
      case KMsgErrorCode.TEMPLATE_NOT_FOUND:
        return "run `k-msg alimtalk preflight --provider <id> --template-code <code> --channel <alias>`";
      default:
        return undefined;
    }
  }

  return undefined;
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
