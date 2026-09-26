/**
 * Bindings, vars and secrets as they arrive on `env`. wrangler.jsonc `vars`,
 * `.dev.vars` and `wrangler secret put` values are not typed at runtime, so
 * readConfig checks each one before the Worker uses it.
 */
export type Env = Record<string, unknown>;

export type ProviderConfig =
  | { name: "mock" }
  | {
      name: "iwinv";
      apiKey: string;
      smsApiKey: string;
      smsAuthKey: string;
      smsCompanyId: string;
    }
  | { name: "solapi"; apiKey: string; apiSecret: string }
  | { name: "aligo"; apiKey: string; userId: string; testMode: boolean };

export interface Config {
  db: D1Database;
  provider: ProviderConfig;
  /** Registered sender (caller ID) number, digits only. Optional for mock. */
  senderNumber: string | undefined;
  /** Bearer token for the admin routes, which refuse every call without it. */
  adminToken: string | undefined;
  /** Secret of the endpoint registered for POST /webhooks/receiver. */
  webhookReceiverSecret: string | undefined;
  /** Development only: accept http://localhost and private-network URLs. */
  allowPrivateWebhookUrls: boolean;
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

/**
 * Checks `env` once per request or cron run. Throws a ConfigError that lists
 * every problem, naming variables but never their values.
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
    const value = env[name];
    if (value === undefined || value === "" || value === false) return false;
    if (value === true || value === "true") return true;
    if (value !== "false") issues.push(`${name} must be "true" or "false"`);
    return false;
  };

  const readProvider = (name: ProviderName): ProviderConfig => {
    const when = `when KMSG_PROVIDER=${name}`;
    switch (name) {
      case "mock":
        return { name };
      case "iwinv":
        return {
          name,
          // IWINVProvider requires the AlimTalk key even for SMS.
          apiKey: requiredText("IWINV_API_KEY", when),
          smsApiKey: requiredText("IWINV_SMS_API_KEY", when),
          smsAuthKey: requiredText("IWINV_SMS_AUTH_KEY", when),
          // SMS delivery status lookups fail without the company id.
          smsCompanyId: requiredText("IWINV_SMS_COMPANY_ID", when),
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

  const rawDb = env.DB;
  const db = isD1Database(rawDb) ? rawDb : undefined;
  if (db === undefined) {
    issues.push("DB must be a D1 binding (d1_databases in wrangler.jsonc)");
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

  const adminToken = text("API_TOKEN");
  if (adminToken !== undefined && adminToken.length < MIN_API_TOKEN_LENGTH) {
    issues.push(
      `API_TOKEN must be at least ${MIN_API_TOKEN_LENGTH} characters (try \`openssl rand -hex 32\`)`,
    );
  }

  const config = {
    provider,
    senderNumber,
    adminToken,
    webhookReceiverSecret: text("WEBHOOK_RECEIVER_SECRET"),
    allowPrivateWebhookUrls: flag("DEV_ALLOW_PRIVATE_WEBHOOK_URLS"),
  };

  if (db === undefined || issues.length > 0) {
    throw new ConfigError(issues);
  }
  return { db, ...config };
}

function isProviderName(value: string): value is ProviderName {
  return PROVIDER_NAMES.some((name) => name === value);
}

function isD1Database(value: unknown): value is D1Database {
  return (
    typeof value === "object" &&
    value !== null &&
    "prepare" in value &&
    typeof value.prepare === "function" &&
    "batch" in value &&
    typeof value.batch === "function"
  );
}
