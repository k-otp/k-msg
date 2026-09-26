const PROVIDER_NAMES = ["mock", "iwinv", "solapi", "aligo"] as const;
type ProviderName = (typeof PROVIDER_NAMES)[number];

export type ProviderConfig =
  | { name: "mock" }
  | {
      name: "iwinv";
      apiKey: string;
      sms?: { apiKey: string; authKey: string; companyId: string };
    }
  | { name: "solapi"; apiKey: string; apiSecret: string }
  | { name: "aligo"; apiKey: string; userId: string; testMode: boolean };

export interface Config {
  port: number;
  apiToken: string;
  alimtalkProvider: ProviderConfig;
  /** The same object as alimtalkProvider when one provider sends both. */
  smsProvider: ProviderConfig;
  /** Registered sender number for the fallback; only the mock needs none. */
  senderNumber: string | undefined;
  templateId: string;
  kakao: { profileId?: string; plusId?: string };
  trackingDbPath: string;
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

  const apiToken = read.optional("API_TOKEN") ?? "";
  if (apiToken.length < 32) {
    problems.push(
      "API_TOKEN must be at least 32 characters; generate one with `openssl rand -hex 32`",
    );
  }

  const alimtalkName = read.oneOf("KMSG_PROVIDER", PROVIDER_NAMES, "mock");
  const smsName = read.oneOf("KMSG_SMS_PROVIDER", PROVIDER_NAMES, alimtalkName);
  const shared = alimtalkName === smsName;
  const alimtalkProvider = readProvider(alimtalkName, shared, read);
  const smsProvider = shared
    ? alimtalkProvider
    : readProvider(smsName, true, read);

  const allMock = alimtalkName === "mock" && smsName === "mock";
  const senderNumber = read.optional("KMSG_SENDER_NUMBER");
  if (senderNumber === undefined && !allMock) {
    problems.push(
      "KMSG_SENDER_NUMBER is required unless every provider is mock",
    );
  } else if (senderNumber !== undefined && !/^\d{8,11}$/.test(senderNumber)) {
    problems.push("KMSG_SENDER_NUMBER must be 8 to 11 digits, no hyphens");
  }

  // SOLAPI and Aligo address AlimTalk by the Kakao sender profile. k-msg also
  // insists on the channel's plus ID for SOLAPI, which cannot infer it.
  const needsProfile = alimtalkName === "solapi" || alimtalkName === "aligo";
  const kakao = {
    profileId: needsProfile
      ? read.required("KAKAO_PROFILE_ID")
      : read.optional("KAKAO_PROFILE_ID"),
    plusId:
      alimtalkName === "solapi"
        ? read.required("KAKAO_PLUS_ID")
        : read.optional("KAKAO_PLUS_ID"),
  };

  const config: Config = {
    port,
    apiToken,
    alimtalkProvider,
    smsProvider,
    senderNumber,
    templateId: read.required("ALIMTALK_TEMPLATE_ID"),
    kakao,
    trackingDbPath: read.optional("TRACKING_DB_PATH") ?? "./data/tracking.db",
  };
  if (problems.length > 0) {
    throw new Error(`Invalid configuration:\n  - ${problems.join("\n  - ")}`);
  }
  return config;
}

function readProvider(
  name: ProviderName,
  sendsSms: boolean,
  read: Reader,
): ProviderConfig {
  switch (name) {
    case "mock":
      return { name };
    case "iwinv":
      // The AlimTalk key is required even when IWINV only sends the SMS; the
      // company id is what IWINV's SMS delivery-status API needs.
      return {
        name,
        apiKey: read.required("IWINV_API_KEY"),
        sms: sendsSms
          ? {
              apiKey: read.required("IWINV_SMS_API_KEY"),
              authKey: read.required("IWINV_SMS_AUTH_KEY"),
              companyId: read.required("IWINV_SMS_COMPANY_ID"),
            }
          : undefined,
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
