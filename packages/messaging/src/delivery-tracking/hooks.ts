import type { KMsgHooks } from "../hooks";
import type { DeliveryTrackingService } from "./service";

export function createDeliveryTrackingHooks(
  service: DeliveryTrackingService,
  options?: {
    onError?: (error: unknown) => void | Promise<void>;
    onQueued?: (context: unknown) => void | Promise<void>;
    onRetryScheduled?: (
      context: unknown,
      error: unknown,
      metadata: unknown,
    ) => void | Promise<void>;
    onFinal?: (context: unknown, state: unknown) => void | Promise<void>;
  },
): KMsgHooks {
  return {
    onQueued: async (context, result) => {
      try {
        await service.recordSend(context, result);
      } catch (error) {
        await options?.onError?.(error);
      }

      await options?.onQueued?.(context);
    },
    onSuccess: async (context, result) => {
      try {
        await service.recordSend(context, result);
      } catch (error) {
        // Tracking should never break sends. Best-effort only.
        await options?.onError?.(error);
      }
    },
    onRetryScheduled: async (context, error, metadata) => {
      await options?.onRetryScheduled?.(context, error, metadata);
    },
    onFinal: async (context, state) => {
      await options?.onFinal?.(context, state);
    },
    onError: async (_context, error) => {
      await options?.onError?.(error);
    },
  };
}
