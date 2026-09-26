export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context: LogContext;
  error?: Error;
  duration?: number;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile?: boolean;
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableJson?: boolean;
  enableColors?: boolean;
}

const REDACTED_TOKEN = "[REDACTED]";
const MASKED_TOKEN = "***";
const SENSITIVE_CONTEXT_KEYS = [
  "to",
  "from",
  "phone",
  "phoneNumber",
  "recipient",
  "sender",
  "secret",
  "apiKey",
  "apiSecret",
  "authorization",
  "auth",
  "token",
  "password",
  "payload",
  "message",
  "content",
  "text",
] as const;

function isSensitiveContextKey(rawKey: string): boolean {
  const key = rawKey.toLowerCase();
  return SENSITIVE_CONTEXT_KEYS.some((candidate) =>
    key.includes(candidate.toLowerCase()),
  );
}

function maskStringValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return MASKED_TOKEN;
  if (trimmed.includes("@")) {
    const [local, domain] = trimmed.split("@");
    const head = local.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
  }
  const head = trimmed.slice(0, 3);
  const tail = trimmed.slice(-2);
  return `${head}${"*".repeat(Math.max(1, trimmed.length - 5))}${tail}`;
}

// Messages, error text, and free-text context values cannot be redacted by
// key, so they are scrubbed for the values the logging policy protects:
// Korean phone numbers (domestic, VoIP, or +82), credentials written as
// key/value pairs (`apiKey=...`, `client_secret: ...`, `"password":"..."`,
// `password='...'`, `Authorization: Bearer ...`), and passwords in URLs
// (`postgres://user:...@host`). A quoted value is redacted to its closing
// quote, or to the end if it has none; a bare value only up to the first
// space. A URL password containing a raw "/" is indistinguishable from a
// path and is not matched.
const PHONE_NUMBER_PATTERN =
  /(?<![\w+])(?:\+82[-.\s]?0?|0)(?:1[016789]|2|70|50\d|[3-6]\d)[-.\s]?\d{3,4}[-.\s]?\d{4}(?!\w)/g;
const URL_PASSWORD_PATTERN = /(\b[a-z][\w+.-]*:\/\/[^\s/:@]*):[^\s/?#]*@/gi;
const CREDENTIAL_PATTERN =
  /\b([\w-]*(?:api[-_]?key|api[-_]?secret|access[-_]?token|refresh[-_]?token|token|secret|password|passwd|authorization|auth))(["']?\s*[:=]\s*)(?:"[^"]*"?|'[^']*'?|((?:Bearer|Basic)\s+)?[^\s"',;&]+)/gi;

export function redactLogText(text: string): string {
  return text
    .replace(URL_PASSWORD_PATTERN, `$1:${REDACTED_TOKEN}@`)
    .replace(PHONE_NUMBER_PATTERN, (phone) => maskStringValue(phone))
    .replace(
      CREDENTIAL_PATTERN,
      (match, key: string, separator: string, scheme: string | undefined) => {
        const quote = match[key.length + separator.length];
        return quote === '"' || quote === "'"
          ? `${key}${separator}${quote}${REDACTED_TOKEN}${quote}`
          : `${key}${separator}${scheme ?? ""}${REDACTED_TOKEN}`;
      },
    );
}

function sanitizeContextValue(key: string, value: unknown): unknown {
  if (value === undefined || value === null) return value;

  if (isSensitiveContextKey(key)) {
    if (typeof value === "string") return maskStringValue(value);
    if (typeof value === "number" || typeof value === "boolean") {
      return MASKED_TOKEN;
    }
    if (Array.isArray(value)) return REDACTED_TOKEN;
    if (typeof value === "object") return REDACTED_TOKEN;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeContextValue(key, entry));
  }

  if (typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      next[childKey] = sanitizeContextValue(childKey, childValue);
    }
    return next;
  }

  if (typeof value === "string") return redactLogText(value);

  return value;
}

function sanitizeLogContext(context: LogContext): LogContext {
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = sanitizeContextValue(key, value);
  }
  return sanitized;
}

/**
 * @evidence docs/security/field-crypto-v1.md#logging-policy
 *   Masks sensitive context keys and scrubs the message, error text, and
 *   string context values with redactLogText before output.
 * @evidenceReview docs/security/field-crypto-v1.md#logging-policy #0f37b79
 *   Read formatMessage, sanitizeContextValue, and redactLogText, and ran
 *   logger.test.ts: phone numbers, key/value credentials (compound and
 *   quoted), and URL passwords stay out of messages, errors, and context
 *   in JSON and text modes.
 */
export class Logger {
  private config: LoggerConfig;
  private context: LogContext;

  constructor(context: LogContext = {}, config: Partial<LoggerConfig> = {}) {
    this.context = context;
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableJson: false,
      enableColors: true,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private formatMessage(entry: LogEntry): string {
    const context = sanitizeLogContext(entry.context);
    const text = redactLogText(entry.message);
    const error = entry.error && {
      name: entry.error.name,
      message: redactLogText(entry.error.message),
      stack: entry.error.stack ? redactLogText(entry.error.stack) : undefined,
    };

    if (this.config.enableJson) {
      return JSON.stringify({
        level: entry.level,
        message: text,
        timestamp: entry.timestamp.toISOString(),
        context,
        ...(error && { error }),
        ...(entry.duration && { duration: entry.duration }),
      });
    }

    const timestamp = entry.timestamp.toISOString();
    const level = this.config.enableColors
      ? this.colorizeLevel(entry.level)
      : entry.level;
    const contextStr =
      Object.keys(context).length > 0
        ? ` [${Object.entries(context)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}]`
        : "";

    let message = `${timestamp} ${level}${contextStr}: ${text}`;

    if (entry.duration !== undefined) {
      message += ` (${entry.duration}ms)`;
    }

    if (error) {
      message += `\n${error.stack ?? `${error.name}: ${error.message}`}`;
    }

    return message;
  }

  private colorizeLevel(level: LogLevel): string {
    if (!this.config.enableColors) return level;

    const colors = {
      [LogLevel.DEBUG]: "\x1b[36m", // cyan
      [LogLevel.INFO]: "\x1b[32m", // green
      [LogLevel.WARN]: "\x1b[33m", // yellow
      [LogLevel.ERROR]: "\x1b[31m", // red
    };

    return `${colors[level]}${level}\x1b[0m`;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const message = this.formatMessage(entry);

    if (this.config.enableConsole) {
      const logFn =
        entry.level === LogLevel.ERROR
          ? console.error
          : entry.level === LogLevel.WARN
            ? console.warn
            : console.log;
      logFn(message);
    }

    // File logging would be implemented here if needed
    if (this.config.enableFile && this.config.filePath) {
      // Bun.write(this.config.filePath, message + '\n', { createPath: true });
    }
  }

  debug(message: string, context: LogContext = {}): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context },
    });
  }

  info(message: string, context: LogContext = {}): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context },
    });
  }

  warn(message: string, context: LogContext = {}, error?: Error): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context },
      error,
    });
  }

  error(message: string, context: LogContext = {}, error?: Error): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...context },
      error,
    });
  }

  child(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context }, this.config);
  }

  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration });
    };
  }

  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    context: LogContext = {},
  ): Promise<T> {
    const start = Date.now();
    const operationContext = { ...context, operation };

    this.debug(`Starting ${operation}`, operationContext);

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.info(`Completed ${operation}`, { ...operationContext, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;

      this.error(
        `Failed ${operation}`,
        { ...operationContext, duration },
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }
}

// Global logger instance
let globalLogger: Logger;

export function createLogger(
  context?: LogContext,
  config?: Partial<LoggerConfig>,
): Logger {
  return new Logger(context, config);
}

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = createLogger();
  }
  return globalLogger;
}

export function setGlobalLogger(logger: Logger): void {
  globalLogger = logger;
}

// Convenience functions
export const logger = {
  debug: (message: string, context?: LogContext) =>
    getLogger().debug(message, context),
  info: (message: string, context?: LogContext) =>
    getLogger().info(message, context),
  warn: (message: string, context?: LogContext, error?: Error) =>
    getLogger().warn(message, context, error),
  error: (message: string, context?: LogContext, error?: Error) =>
    getLogger().error(message, context, error),
  child: (context: LogContext) => getLogger().child(context),
  time: (label: string) => getLogger().time(label),
  measure: <T>(operation: string, fn: () => Promise<T>, context?: LogContext) =>
    getLogger().measure(operation, fn, context),
};

// Express-style middleware for Hono
export function loggerMiddleware(config?: Partial<LoggerConfig>) {
  const requestLogger = createLogger({}, config);

  return async (c: any, next: any) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    const context = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header("user-agent") || "unknown",
    };

    requestLogger.info("Request started", context);

    try {
      await next();

      const duration = Date.now() - start;
      requestLogger.info("Request completed", {
        ...context,
        status: c.res.status,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - start;
      requestLogger.error(
        "Request failed",
        {
          ...context,
          duration,
        },
        error instanceof Error ? error : new Error(String(error)),
      );

      throw error;
    }
  };
}
