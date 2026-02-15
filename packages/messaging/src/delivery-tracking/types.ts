import type { DeliveryStatus, KMsgError, MessageType } from "@k-msg/core";

export interface TrackingError {
  code: string;
  message: string;
}

export interface TrackingRecord {
  messageId: string;
  providerId: string;
  /**
   * Provider-assigned message id used to query status APIs.
   * When missing, store implementations may persist an empty string and the tracker will stop polling.
   */
  providerMessageId: string;
  type: MessageType;
  to: string;
  from?: string;
  requestedAt: Date;
  scheduledAt?: Date;
  status: DeliveryStatus;
  providerStatusCode?: string;
  providerStatusMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  statusUpdatedAt: Date;
  attemptCount: number;
  lastCheckedAt?: Date;
  nextCheckAt: Date;
  lastError?: TrackingError;
  raw?: unknown;
  metadata?: Record<string, unknown>;
}

export type UnsupportedProviderStrategy = "skip" | "unknown";

export interface DeliveryTrackingPollingConfig {
  intervalMs: number;
  batchSize: number;
  concurrency: number;
  initialDelayMs: number;
  scheduledGraceMs: number;
  backoffMs: number[];
  maxTrackingDurationMs: number;
  unsupportedProviderStrategy: UnsupportedProviderStrategy;
}

export const DEFAULT_POLLING_CONFIG: DeliveryTrackingPollingConfig = {
  intervalMs: 5_000,
  batchSize: 200,
  concurrency: 10,
  initialDelayMs: 30_000,
  scheduledGraceMs: 120_000,
  backoffMs: [30_000, 120_000, 600_000, 1_800_000, 7_200_000],
  maxTrackingDurationMs: 86_400_000,
  unsupportedProviderStrategy: "skip",
};

export const TERMINAL_DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  "DELIVERED",
  "FAILED",
  "CANCELLED",
  "UNKNOWN",
];

export function isTerminalDeliveryStatus(status: DeliveryStatus): boolean {
  return TERMINAL_DELIVERY_STATUSES.includes(status);
}

export interface TrackingUpdate {
  messageId: string;
  patch: Partial<TrackingRecord>;
  nextCheckAt: Date;
  terminal: boolean;
  raw?: unknown;
}

export interface TrackingReconcileResult {
  updates: TrackingUpdate[];
  errors: Array<{ messageId: string; error: KMsgError }>;
}
