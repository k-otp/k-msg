import { Buffer } from "node:buffer";
import { isIP } from "node:net";

const PROVIDER_NAMES = ["mock", "iwinv", "solapi", "aligo"] as const;

export type ProviderConfig =
  | { name: "mock" }
  | { name: "iwinv"; apiKey: string; smsApiKey: string; smsAuthKey: string }
  | { name: "solapi"; apiKey: string; apiSecret: string }
  | { name: "aligo"; apiKey: string; userId: string; testMode: boolean };

export interface Config {
  port: number;
  provider: ProviderConfig;
  /** Sender number registered with the provider; only the mock needs none. */
  senderNumber: string | undefined;
  /** HMAC key for stored codes. */
  otpSecret: string;
  /** Codes the whole service sends per hour, a ceiling on SMS spend. */
  maxSendsPerHour: number;
  /** Express's `trust proxy`: a hop count, or addresses and subnets. */
  trustProxy: number | string | undefined;
}

type Env = Readonly<Record<string, string | undefined>>;

interface Reader {
  optional(name: string): string | undefined;
  required(name: string): string;
  flag(name: string): boolean;
  oneOf<T extends string>(name: string, values: readonly T[], fallback: T): T;
}

/**
 * Reads the configuration once at startup. Throws one error that lists every
 * missing or invalid variable, so a bad deploy fails before serving traffic.
 */
export function loadConfig(env: Env): Config {
  const problems: string[] = [];
  const read = createReader(env, problems);

  const port = Number(read.optional("PORT") ?? "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    problems.push("PORT must be an integer from 1 to 65535");
  }

  const provider = readProvider(
    read.oneOf("KMSG_PROVIDER", PROVIDER_NAMES, "mock"),
    read,
  );

  const senderNumber = read.optional("KMSG_SENDER_NUMBER");
  if (senderNumber === undefined && provider.name !== "mock") {
    problems.push(`KMSG_SENDER_NUMBER is required for ${provider.name}`);
  } else if (senderNumber !== undefined && !/^\d{8,11}$/.test(senderNumber)) {
    problems.push("KMSG_SENDER_NUMBER must be 8 to 11 digits, no hyphens");
  }

  const otpSecret = read.optional("OTP_SECRET") ?? "";
  if (Buffer.byteLength(otpSecret) < 32) {
    problems.push(
      "OTP_SECRET must be at least 32 bytes; generate one with `openssl rand -hex 32`",
    );
  }

  const maxSendsPerHour = Number(
    read.optional("OTP_MAX_SENDS_PER_HOUR") ?? "1000",
  );
  if (!Number.isInteger(maxSendsPerHour) || maxSendsPerHour < 1) {
    problems.push("OTP_MAX_SENDS_PER_HOUR must be a positive integer");
  }

  const trustProxy = readTrustProxy(read.optional("TRUST_PROXY"), problems);

  if (problems.length > 0) {
    throw new Error(`Invalid configuration:\n  - ${problems.join("\n  - ")}`);
  }
  return {
    port,
    provider,
    senderNumber,
    otpSecret,
    maxSendsPerHour,
    trustProxy,
  };
}

const PROXY_PRESETS = ["loopback", "linklocal", "uniquelocal"];

/**
 * A hop count such as `1`, or a comma-separated list of proxy addresses,
 * subnets such as `10.0.0.0/8`, and Express's presets (`loopback`,
 * `linklocal`, `uniquelocal`). `true` is refused: it would take the client
 * address from X-Forwarded-For, which any caller can set, and so let one
 * caller dodge the per-client limit.
 */
function readTrustProxy(
  value: string | undefined,
  problems: string[],
): number | string | undefined {
  if (value === undefined || value === "false") return undefined;
  if (value === "true") {
    problems.push(
      "TRUST_PROXY=true trusts X-Forwarded-For from any caller; set the number of proxies in front of the server, such as 1",
    );
    return undefined;
  }
  if (/^\d+$/.test(value)) return Number(value);
  const entries = value.split(",").map((entry) => entry.trim());
  if (!entries.every(isProxyEntry)) {
    problems.push(
      `TRUST_PROXY must be a number of proxies, such as 1, or addresses, subnets other than /0 (10.0.0.0/8) and presets (${PROXY_PRESETS.join(", ")}) separated by commas`,
    );
    return undefined;
  }
  return entries.join(",");
}

// A /0 subnet is refused for the same reason as `true`: it covers every
// address, so any caller could set its own client address. Each entry is
// checked alone, which catches a mistake, not every combination.
function isProxyEntry(entry: string): boolean {
  if (PROXY_PRESETS.includes(entry)) return true;
  const [address = "", prefix, ...rest] = entry.split("/");
  const version = isIP(address);
  if (version === 0 || rest.length > 0) return false;
  if (prefix === undefined) return true;
  if (!/^\d+$/.test(prefix)) return false;
  const bits = Number(prefix);
  return bits >= 1 && bits <= (version === 4 ? 32 : 128);
}

function readProvider(
  name: ProviderConfig["name"],
  read: Reader,
): ProviderConfig {
  switch (name) {
    case "mock":
      return { name };
    case "iwinv":
      // IWINVProvider requires the AlimTalk key even when it only sends SMS.
      return {
        name,
        apiKey: read.required("IWINV_API_KEY"),
        smsApiKey: read.required("IWINV_SMS_API_KEY"),
        smsAuthKey: read.required("IWINV_SMS_AUTH_KEY"),
      };
    case "solapi":
      return {
        name,
        apiKey: read.required("SOLAPI_API_KEY"),
        apiSecret: read.required("SOLAPI_API_SECRET"),
      };
    case "aligo":
      return {
        name,
        apiKey: read.required("ALIGO_API_KEY"),
        userId: read.required("ALIGO_USER_ID"),
        testMode: read.flag("ALIGO_TEST_MODE"),
      };
  }
}

function createReader(env: Env, problems: string[]): Reader {
  const optional = (name: string) => env[name]?.trim() || undefined;
  return {
    optional,
    required(name) {
      const value = optional(name);
      if (value === undefined) problems.push(`${name} is required`);
      return value ?? "";
    },
    flag(name) {
      const value = optional(name);
      if (value !== undefined && value !== "true" && value !== "false") {
        problems.push(`${name} must be true or false`);
      }
      return value === "true";
    },
    oneOf(name, values, fallback) {
      const value = optional(name) ?? fallback;
      const match = values.find((candidate) => candidate === value);
      if (match === undefined) {
        problems.push(`${name} must be one of ${values.join(", ")}`);
      }
      return match ?? fallback;
    },
  };
}
