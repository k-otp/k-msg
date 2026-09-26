import { type LogContext, logger } from "@k-msg/core";

/**
 * Logs the rejection of work that nothing awaits, such as a timer tick or a
 * job a loop starts without waiting for it. Left unhandled, that rejection
 * would end a Node.js process.
 */
export function logBackgroundFailure(
  message: string,
  error: unknown,
  context?: LogContext,
): void {
  logger.error(
    message,
    context,
    error instanceof Error ? error : new Error(String(error)),
  );
}
