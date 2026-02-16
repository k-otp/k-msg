import { z } from "zod";
import { LogLevel } from "./logger";

// Base configuration schemas
export const DatabaseConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.number().min(1).max(65535).default(5432),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(false),
  maxConnections: z.number().min(1).max(100).default(10),
  connectionTimeout: z.number().min(1000).default(30000),
});

export const RedisConfigSchema = z.object({
  host: z.string().default("localhost"),
  port: z.number().min(1).max(65535).default(6379),
  password: z.string().optional(),
  db: z.number().min(0).max(15).default(0),
  keyPrefix: z.string().default("kmsg:"),
  maxRetries: z.number().min(0).default(3),
});

export const LoggerConfigSchema = z.object({
  level: z.nativeEnum(LogLevel).default(LogLevel.INFO),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(false),
  filePath: z.string().optional(),
  maxFileSize: z
    .number()
    .min(1024)
    .default(10 * 1024 * 1024), // 10MB
  maxFiles: z.number().min(1).default(5),
  enableJson: z.boolean().default(false),
  enableColors: z.boolean().default(true),
});

export const HealthConfigSchema = z.object({
  timeout: z.number().min(1000).max(30000).default(5000),
  interval: z.number().min(1000).default(30000),
  retries: z.number().min(0).max(5).default(3),
  includeMetrics: z.boolean().default(true),
});

// Provider-specific configurations
export const IWINVConfigSchema = z.object({
  apiKey: z.string().min(1),
  timeout: z.number().min(1000).max(60000).default(10000),
  retryAttempts: z.number().min(0).max(5).default(3),
  retryDelay: z.number().min(100).default(1000),
  debug: z.boolean().default(false),
  rateLimit: z
    .object({
      requests: z.number().min(1).default(100),
      perSecond: z.number().min(1).default(1),
    })
    .default({ requests: 100, perSecond: 1 }),
});

export const SMSConfigSchema = z.object({
  provider: z.enum(["iwinv", "aligo", "solapi", "coolsms"]),
  apiKey: z.string().min(1),
  apiSecret: z.string().optional(),
  senderId: z.string().min(1),
  defaultCountryCode: z.string().default("+82"),
  timeout: z.number().min(1000).default(10000),
});

// Application configurations
export const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default("localhost"),
  cors: z
    .object({
      origins: z.array(z.string()).default(["*"]),
      credentials: z.boolean().default(false),
    })
    .default({ origins: ["*"], credentials: false }),
  maxRequestSize: z
    .number()
    .min(1024)
    .default(10 * 1024 * 1024), // 10MB
  requestTimeout: z.number().min(1000).default(30000),
  enableMetrics: z.boolean().default(true),
  enableDocs: z.boolean().default(true),
});

export const QueueConfigSchema = z.object({
  maxConcurrency: z.number().min(1).max(100).default(10),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(100).default(1000),
  maxAge: z.number().min(60000).default(3600000), // 1 hour
  batchSize: z.number().min(1).max(1000).default(100),
  processingInterval: z.number().min(100).default(5000),
});

// Main application configuration
export const KMessageConfigSchema = z.object({
  environment: z
    .enum(["development", "staging", "production"])
    .default("development"),

  server: ServerConfigSchema.default({
    port: 3000,
    host: "localhost",
    cors: { origins: ["*"], credentials: false },
    maxRequestSize: 10485760,
    requestTimeout: 30000,
    enableMetrics: true,
    enableDocs: true,
  }),

  database: DatabaseConfigSchema.optional(),
  redis: RedisConfigSchema.optional(),

  logger: LoggerConfigSchema.default({
    level: LogLevel.INFO,
    enableConsole: true,
    enableFile: false,
    maxFileSize: 10485760,
    maxFiles: 5,
    enableJson: false,
    enableColors: true,
  }),
  health: HealthConfigSchema.default({
    timeout: 5000,
    interval: 30000,
    retries: 3,
    includeMetrics: true,
  }),
  queue: QueueConfigSchema.default({
    maxConcurrency: 10,
    maxRetries: 3,
    retryDelay: 1000,
    maxAge: 3600000,
    batchSize: 100,
    processingInterval: 5000,
  }),

  providers: z
    .object({
      iwinv: IWINVConfigSchema.optional(),
      sms: SMSConfigSchema.optional(),
    })
    .default({ iwinv: undefined, sms: undefined }),

  features: z
    .object({
      enableBulkSending: z.boolean().default(true),
      enableScheduling: z.boolean().default(false),
      enableAnalytics: z.boolean().default(true),
      enableWebhooks: z.boolean().default(false),
      enableTemplateCache: z.boolean().default(true),
      maxTemplatesPerProvider: z.number().min(1).default(1000),
      maxRecipientsPerBatch: z.number().min(1).max(10000).default(1000),
    })
    .default({
      enableBulkSending: true,
      enableScheduling: false,
      enableAnalytics: true,
      enableWebhooks: false,
      enableTemplateCache: true,
      maxTemplatesPerProvider: 1000,
      maxRecipientsPerBatch: 1000,
    }),

  security: z
    .object({
      apiKeyRequired: z.boolean().default(true),
      rateLimitEnabled: z.boolean().default(true),
      maxRequestsPerMinute: z.number().min(1).default(1000),
      enableCors: z.boolean().default(true),
      trustedProxies: z.array(z.string()).default([]),
    })
    .default({
      apiKeyRequired: true,
      rateLimitEnabled: true,
      maxRequestsPerMinute: 1000,
      enableCors: true,
      trustedProxies: [],
    }),
});

// Inferred types
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type ConfigLoggerConfig = z.infer<typeof LoggerConfigSchema>;
export type HealthConfig = z.infer<typeof HealthConfigSchema>;
export type IWINVConfig = z.infer<typeof IWINVConfigSchema>;
export type SMSConfig = z.infer<typeof SMSConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type QueueConfig = z.infer<typeof QueueConfigSchema>;
export type KMessageConfig = z.infer<typeof KMessageConfigSchema>;

// Configuration loader
// biome-ignore lint/complexity/noStaticOnlyClass: kept as a static namespace for config helpers
export class ConfigLoader {
  static loadFromEnv(): KMessageConfig {
    const config = {
      environment: process.env.NODE_ENV || "development",

      server: {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
        host: process.env.HOST,
        cors: {
          origins: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(",")
            : undefined,
        },
      },

      database: process.env.DATABASE_URL
        ? {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT
              ? parseInt(process.env.DB_PORT, 10)
              : undefined,
            database: process.env.DB_NAME,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === "true",
          }
        : undefined,

      redis: process.env.REDIS_URL
        ? {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
              ? parseInt(process.env.REDIS_PORT, 10)
              : undefined,
            password: process.env.REDIS_PASSWORD,
            db: process.env.REDIS_DB
              ? parseInt(process.env.REDIS_DB, 10)
              : undefined,
          }
        : undefined,

      logger: {
        level: process.env.LOG_LEVEL as LogLevel,
        enableJson: process.env.LOG_JSON === "true",
        enableColors: process.env.LOG_COLORS !== "false",
      },

      providers: {
        iwinv: process.env.IWINV_API_KEY
          ? {
              apiKey: process.env.IWINV_API_KEY,
              debug: process.env.IWINV_DEBUG === "true",
            }
          : undefined,

        sms: process.env.SMS_PROVIDER
          ? {
              // Backward-compatible alias: "coolsms" -> "solapi"
              provider: (process.env.SMS_PROVIDER === "coolsms"
                ? "solapi"
                : process.env.SMS_PROVIDER) as "iwinv" | "aligo" | "solapi",
              apiKey: process.env.SMS_API_KEY ?? "",
              apiSecret: process.env.SMS_API_SECRET,
              senderId: process.env.SMS_SENDER_ID ?? "",
            }
          : undefined,
      },

      security: {
        apiKeyRequired: process.env.API_KEY_REQUIRED !== "false",
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
        maxRequestsPerMinute: process.env.MAX_REQUESTS_PER_MINUTE
          ? parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10)
          : undefined,
      },
    };

    return ConfigLoader.validate(config);
  }

  static async loadFromFile(filePath: string): Promise<KMessageConfig> {
    try {
      const config = await Bun.file(filePath).json();
      return ConfigLoader.validate(config);
    } catch (error) {
      throw new Error(`Failed to load config from file: ${error}`);
    }
  }

  static validate(config: unknown): KMessageConfig {
    try {
      return KMessageConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(
          (e) => `${e.path.join(".")}: ${e.message}`,
        );
        throw new Error(
          `Configuration validation failed:\n${errors.join("\n")}`,
        );
      }
      throw error;
    }
  }

  static getDefaults(): KMessageConfig {
    return KMessageConfigSchema.parse({});
  }
}

// Deep partial utility for environment-specific overrides
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Environment-specific configurations
// Only include values that DIFFER from schema defaults
export const developmentConfig: DeepPartial<KMessageConfig> = {
  logger: {
    level: LogLevel.DEBUG,
    enableColors: true,
    enableJson: false,
  },
  server: {
    enableDocs: true,
  },
};

export const productionConfig: DeepPartial<KMessageConfig> = {
  logger: {
    level: LogLevel.INFO,
    enableColors: false,
    enableJson: true,
  },
  server: {
    enableDocs: false,
  },
  security: {
    apiKeyRequired: true,
    rateLimitEnabled: true,
    maxRequestsPerMinute: 1000,
    enableCors: true,
  },
};

// Utility functions
export function mergeConfigs(
  base: KMessageConfig,
  override: Partial<KMessageConfig>,
): KMessageConfig {
  return KMessageConfigSchema.parse({
    ...base,
    ...override,
    server: { ...base.server, ...override.server },
    logger: { ...base.logger, ...override.logger },
    providers: { ...base.providers, ...override.providers },
    features: { ...base.features, ...override.features },
    security: { ...base.security, ...override.security },
  });
}

export function validateProviderConfig(
  provider: "iwinv" | "sms",
  config: unknown,
): IWINVConfig | SMSConfig {
  switch (provider) {
    case "iwinv":
      return IWINVConfigSchema.parse(config);
    case "sms":
      return SMSConfigSchema.parse(config);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
