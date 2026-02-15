import type { MessageType } from "./message";

export type DeliveryStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED"
  | "UNKNOWN";

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
