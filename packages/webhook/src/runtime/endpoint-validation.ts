import type { WebhookRuntimeSecurityOptions } from "./types";

export interface EndpointValidationOptions {
  allowPrivateHosts: boolean;
  allowHttpForLocalhost: boolean;
}

export const DEFAULT_ENDPOINT_VALIDATION_OPTIONS: EndpointValidationOptions = {
  allowPrivateHosts: false,
  allowHttpForLocalhost: true,
};

function isLocalhost(hostname: string): boolean {
  const lowered = hostname.toLowerCase();
  return (
    lowered === "localhost" || lowered === "127.0.0.1" || lowered === "::1"
  );
}

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return false;
  }

  const first = Number(match[1]);
  const second = Number(match[2]);

  if (!Number.isInteger(first) || !Number.isInteger(second)) {
    return false;
  }

  if (first === 10) return true;
  if (first === 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;

  return false;
}

function isPrivateHostname(hostname: string): boolean {
  const lowered = hostname.toLowerCase();

  if (isLocalhost(lowered) || isPrivateIpv4(lowered)) {
    return true;
  }

  if (
    lowered.endsWith(".local") ||
    lowered.endsWith(".internal") ||
    lowered.endsWith(".localhost")
  ) {
    return true;
  }

  return false;
}

export function resolveEndpointValidationOptions(
  security: WebhookRuntimeSecurityOptions | undefined,
): EndpointValidationOptions {
  return {
    allowPrivateHosts:
      security?.allowPrivateHosts ??
      DEFAULT_ENDPOINT_VALIDATION_OPTIONS.allowPrivateHosts,
    allowHttpForLocalhost:
      security?.allowHttpForLocalhost ??
      DEFAULT_ENDPOINT_VALIDATION_OPTIONS.allowHttpForLocalhost,
  };
}

export function validateEndpointUrl(
  rawUrl: string,
  options: EndpointValidationOptions = DEFAULT_ENDPOINT_VALIDATION_OPTIONS,
): URL {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  const hostname = parsed.hostname;
  const localhost = isLocalhost(hostname);

  if (parsed.protocol !== "https:") {
    if (
      !(
        options.allowHttpForLocalhost &&
        localhost &&
        parsed.protocol === "http:"
      )
    ) {
      throw new Error("Webhook URL must use HTTPS");
    }
  }

  if (!options.allowPrivateHosts && isPrivateHostname(hostname)) {
    throw new Error("Private hosts are not allowed for webhook endpoints");
  }

  return parsed;
}
