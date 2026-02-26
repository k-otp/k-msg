import type { MessageType } from "./message";

export type DeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED"
  | "UNKNOWN";

export const KMSG_DELIVERY_STATUSES = [
  "PENDING",
  "SENT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
  "UNKNOWN",
] as const satisfies readonly DeliveryStatus[];

export const KMSG_TERMINAL_STATUSES = [
  "DELIVERED",
  "FAILED",
  "CANCELLED",
  "UNKNOWN",
] as const satisfies readonly DeliveryStatus[];

export const KMSG_POLLABLE_STATUSES = [
  "PENDING",
  "SENT",
] as const satisfies readonly DeliveryStatus[];

const DELIVERY_STATUS_SET: ReadonlySet<string> = new Set(
  KMSG_DELIVERY_STATUSES,
);
const TERMINAL_STATUS_SET: ReadonlySet<string> = new Set(
  KMSG_TERMINAL_STATUSES,
);
const POLLABLE_STATUS_SET: ReadonlySet<string> = new Set(
  KMSG_POLLABLE_STATUSES,
);

export function isKMsgDeliveryStatus(value: string): value is DeliveryStatus {
  return DELIVERY_STATUS_SET.has(value);
}

export function isKMsgTerminalStatus(value: string): boolean {
  return TERMINAL_STATUS_SET.has(value);
}

export function isTerminalDeliveryStatus(status: DeliveryStatus): boolean {
  return TERMINAL_STATUS_SET.has(status);
}

export function isPollableDeliveryStatus(status: DeliveryStatus): boolean {
  return POLLABLE_STATUS_SET.has(status);
}

export function getPollableStatuses(): readonly DeliveryStatus[] {
  return KMSG_POLLABLE_STATUSES;
}

export interface DeliveryStatusQuery {
  providerMessageId: string;
  type: MessageType;
  to: string;
  requestedAt: Date;
  scheduledAt?: Date;
}

export interface DeliveryStatusResult {
  providerId: string;
  providerMessageId: string;
  status: DeliveryStatus;
  statusCode?: string;
  statusMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  raw?: unknown;
}
