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
    if (this.config.enableJson) {
      return JSON.stringify({
        level: entry.level,
        message: entry.message,
        timestamp: entry.timestamp.toISOString(),
        context: entry.context,
        ...(entry.error && {
          error: {
            name: entry.error.name,
            message: entry.error.message,
            stack: entry.error.stack,
          },
        }),
        ...(entry.duration && { duration: entry.duration }),
      });
    }

    const timestamp = entry.timestamp.toISOString();
    const level = this.config.enableColors
      ? this.colorizeLevel(entry.level)
      : entry.level;
    const contextStr =
      Object.keys(entry.context).length > 0
        ? ` [${Object.entries(entry.context)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}]`
        : "";

    let message = `${timestamp} ${level}${contextStr}: ${entry.message}`;

    if (entry.duration !== undefined) {
      message += ` (${entry.duration}ms)`;
    }

    if (entry.error) {
      message += `\n${entry.error.stack}`;
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
