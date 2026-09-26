import { Buffer } from "node:buffer";

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

  if (problems.length > 0) {
    throw new Error(`Invalid configuration:\n  - ${problems.join("\n  - ")}`);
  }
  return { port, provider, senderNumber, otpSecret };
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
