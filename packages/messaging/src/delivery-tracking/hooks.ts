import type { KMsgHooks } from "../hooks";
import type { DeliveryTrackingService } from "./service";

export function createDeliveryTrackingHooks(
  service: DeliveryTrackingService,
  options?: { onError?: (error: unknown) => void | Promise<void> },
): KMsgHooks {
  return {
    onSuccess: async (context, result) => {
      try {
        await service.recordSend(context, result);
      } catch (error) {
        // Tracking should never break sends. Best-effort only.
        await options?.onError?.(error);
      }
    },
  };
}
