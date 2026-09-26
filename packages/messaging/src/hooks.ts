import type { KMsgError, SendOptions, SendResult } from "@k-msg/core";

export interface HookContext {
  messageId: string;
  options: SendOptions;
  timestamp: number;
  providerId?: string;
  requestId?: string;
  attempt?: number;
}

export interface RetryScheduledHookContext {
  attempt: number;
  retryAfterMs?: number;
}

export type SendHookFinalOutcome = "success" | "failure" | "aborted";

export interface SendHookFinalState {
  outcome: SendHookFinalOutcome;
  result?: SendResult;
  error?: KMsgError;
  retryAfterMs?: number;
}

/**
 * Hooks that observe a send; see {@link KMsgHooks.onHookError}. `KMsg` does
 * not dispatch onRetryScheduled itself; a caller that does must guard it the
 * same way.
 */
export type KMsgObserverHook =
  | "onSuccess"
  | "onError"
  | "onQueued"
  | "onRetryScheduled"
  | "onFinal";

export interface KMsgHookErrorContext {
  hook: KMsgObserverHook;
  context: HookContext;
}

export interface KMsgHooks {
  /**
   * Runs before the provider is called. Throwing aborts the send and rejects
   * the call.
   */
  onBeforeSend?: (context: HookContext) => void | Promise<void>;
  onSuccess?: (
    context: HookContext,
    result: SendResult,
  ) => void | Promise<void>;
  onError?: (context: HookContext, error: KMsgError) => void | Promise<void>;
  onQueued?: (context: HookContext, result: SendResult) => void | Promise<void>;
  onRetryScheduled?: (
    context: HookContext & RetryScheduledHookContext,
    error: KMsgError,
    metadata: {
      retryAfterMs?: number;
      reason: string;
    },
  ) => void | Promise<void>;
  onFinal?: (
    context: HookContext,
    state: SendHookFinalState,
  ) => void | Promise<void>;
  /**
   * Receives errors thrown by the observer hooks (every hook except
   * onBeforeSend). Those errors never change the send result. Without this
   * hook, or when it throws too, they are written to `console.error`.
   */
  onHookError?: (
    error: unknown,
    info: KMsgHookErrorContext,
  ) => void | Promise<void>;
}
