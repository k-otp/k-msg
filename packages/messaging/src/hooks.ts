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

export interface KMsgHooks {
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
}
