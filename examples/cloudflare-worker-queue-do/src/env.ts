import type { SendQueue } from "./send-queue";

/**
 * What arrives on `env`. The Durable Object binding is typed from
 * wrangler.jsonc; vars and secrets are unknown until readConfig checks them.
 */
export interface Env {
  SEND_QUEUE: DurableObjectNamespace<SendQueue>;
  [variable: string]: unknown;
}

export type ProviderConfig =
  | { name: "mock" }
  | { name: "iwinv"; apiKey: string; smsApiKey: string; smsAuthKey: string }
  | { name: "solapi"; apiKey: string; apiSecret: string }
  | { name: "aligo"; apiKey: string; userId: string; testMode: boolean };

export interface Config {
  /** Bearer token that every endpoint requires. */
  apiToken: string;
  provider: ProviderConfig;
  /** Registered sender number, digits only. Only the mock provider needs none. */
  senderNumber: string | undefined;
  /** Attempts per message, the first one included, before it is given up. */
  maxAttempts: number;
}

export class ConfigError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid Worker configuration: ${issues.join("; ")}`);
    this.name = "ConfigError";
  }
}

const PROVIDER_NAMES = ["mock", "iwinv", "solapi", "aligo"] as const;
type ProviderName = (typeof PROVIDER_NAMES)[number];

const MIN_API_TOKEN_LENGTH = 32;
// From 8 digits (1588-1234) to 12 (0505-123-4567), hyphens removed.
const SENDER_NUMBER_PATTERN = /^\d{8,12}$/;
const DEFAULT_MAX_ATTEMPTS = 5;
const MAX_ATTEMPTS_LIMIT = 10;

/**
 * Checks `env`. Throws a ConfigError that lists every problem, naming
 * variables but never their values.
 */
export function readConfig(env: Env): Config {
  const issues: string[] = [];

  const text = (name: string): string | undefined => {
    const value = env[name];
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string") {
      issues.push(`${name} must be a string`);
      return undefined;
    }
    return value.trim() || undefined;
  };

  const requiredText = (name: string, when: string): string => {
    const value = text(name);
    if (value === undefined) issues.push(`${name} is required ${when}`);
    // An empty placeholder never escapes: any issue throws below.
    return value ?? "";
  };

  const flag = (name: string): boolean => {
    const value = text(name);
    if (value === undefined || value === "false") return false;
    if (value !== "true") issues.push(`${name} must be "true" or "false"`);
    return value === "true";
  };

  const readProvider = (name: ProviderName): ProviderConfig => {
    const when = `when KMSG_PROVIDER=${name}`;
    switch (name) {
      case "mock":
        return { name };
      case "iwinv":
        // IWINVProvider requires the AlimTalk key even when it only sends SMS.
        // IWINV_SMS_COMPANY_ID is only needed for delivery status lookups,
        // which this example does not make.
        return {
          name,
          apiKey: requiredText("IWINV_API_KEY", when),
          smsApiKey: requiredText("IWINV_SMS_API_KEY", when),
          smsAuthKey: requiredText("IWINV_SMS_AUTH_KEY", when),
        };
      case "solapi":
        return {
          name,
          apiKey: requiredText("SOLAPI_API_KEY", when),
          apiSecret: requiredText("SOLAPI_API_SECRET", when),
        };
      case "aligo":
        return {
          name,
          apiKey: requiredText("ALIGO_API_KEY", when),
          userId: requiredText("ALIGO_USER_ID", when),
          testMode: flag("ALIGO_TEST_MODE"),
        };
    }
  };

  if (!isDurableObjectNamespace(env.SEND_QUEUE)) {
    issues.push(
      "SEND_QUEUE must be a Durable Object binding (durable_objects in wrangler.jsonc)",
    );
  }

  const apiToken = text("API_TOKEN") ?? "";
  if (apiToken.length < MIN_API_TOKEN_LENGTH) {
    issues.push(
      `API_TOKEN must be at least ${MIN_API_TOKEN_LENGTH} characters (try \`openssl rand -hex 32\`)`,
    );
  }

  const providerName = text("KMSG_PROVIDER") ?? "mock";
  let provider: ProviderConfig = { name: "mock" };
  if (isProviderName(providerName)) {
    provider = readProvider(providerName);
  } else {
    issues.push(`KMSG_PROVIDER must be one of ${PROVIDER_NAMES.join(", ")}`);
  }

  const senderNumber = text("KMSG_SENDER_NUMBER")?.replaceAll("-", "");
  if (senderNumber === undefined) {
    if (provider.name !== "mock") {
      issues.push(
        `KMSG_SENDER_NUMBER is required when KMSG_PROVIDER=${provider.name}`,
      );
    }
  } else if (!SENDER_NUMBER_PATTERN.test(senderNumber)) {
    issues.push(
      "KMSG_SENDER_NUMBER must be a registered sender number such as 0212345678",
    );
  }

  const maxAttempts = Number(
    text("SEND_MAX_ATTEMPTS") ?? String(DEFAULT_MAX_ATTEMPTS),
  );
  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > MAX_ATTEMPTS_LIMIT
  ) {
    issues.push(
      `SEND_MAX_ATTEMPTS must be a whole number from 1 to ${MAX_ATTEMPTS_LIMIT}`,
    );
  }

  if (issues.length > 0) throw new ConfigError(issues);
  return { apiToken, provider, senderNumber, maxAttempts };
}

function isProviderName(value: string): value is ProviderName {
  return PROVIDER_NAMES.some((name) => name === value);
}

function isDurableObjectNamespace(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "getByName" in value &&
    typeof value.getByName === "function"
  );
}
