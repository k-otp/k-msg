import type { KMsgError, SendResult } from "@k-msg/core";
import type { HookContext, KMsgHooks } from "../hooks";
import type { DeliveryTrackingService } from "./service";

export interface DeliveryTrackingHooksOptions {
  /**
   * Called when a message the provider accepted could not be recorded for
   * tracking, so it will not be polled. The send still succeeds. Without
   * this option the error is thrown from the hook, and `KMsg` passes it to
   * `onHookError`, or to `console.error` without one.
   */
  onRecordError?: (
    error: unknown,
    info: { context: HookContext; result: SendResult },
  ) => void | Promise<void>;
  /** Called when a send fails, as the `KMsg` `onError` hook. */
  onError?: (error: KMsgError, context: HookContext) => void | Promise<void>;
  onQueued?: (context: unknown) => void | Promise<void>;
  onRetryScheduled?: (
    context: unknown,
    error: unknown,
    metadata: unknown,
  ) => void | Promise<void>;
  onFinal?: (context: unknown, state: unknown) => void | Promise<void>;
}

export function createDeliveryTrackingHooks(
  service: DeliveryTrackingService,
  options: DeliveryTrackingHooksOptions = {},
): KMsgHooks {
  const record = async (
    context: HookContext,
    result: SendResult,
  ): Promise<void> => {
    try {
      await service.recordSend(context, result);
    } catch (error) {
      // Only the tracking is lost; the send itself succeeded.
      if (!options.onRecordError) throw error;
      await options.onRecordError(error, { context, result });
    }
  };

  return {
    onQueued: async (context, result) => {
      const failures: unknown[] = [];
      try {
        await record(context, result);
      } catch (error) {
        failures.push(error);
      }
      // Called whether or not the send could be recorded.
      try {
        await options.onQueued?.(context);
      } catch (error) {
        failures.push(error);
      }
      if (failures.length > 1) {
        throw new AggregateError(
          failures,
          "Recording the queued send and onQueued both failed",
        );
      }
      if (failures.length === 1) throw failures[0];
    },
    onSuccess: async (context, result) => {
      await record(context, result);
    },
    onRetryScheduled: async (context, error, metadata) => {
      await options.onRetryScheduled?.(context, error, metadata);
    },
    onFinal: async (context, state) => {
      await options.onFinal?.(context, state);
    },
    onError: async (context, error) => {
      await options.onError?.(error, context);
    },
  };
}
