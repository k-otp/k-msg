// Last-resort logging for a failure with nowhere else to go. A console
// replacement that throws must not break the send or poll that called it.
export function logFallbackFailure(message: string, error: unknown): void {
  try {
    console.error(message, error);
  } catch {
    // Nothing is left to report to.
  }
}
