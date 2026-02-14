import type { MessageType } from "./message";

export type HistoryChannel = MessageType;

export interface HistoryQuery {
  channel: HistoryChannel;
  startDate: string | Date;
  endDate: string | Date;
  page?: number;
  pageSize?: number;
  /**
   * Cursor key for providers that use cursor-based pagination (e.g. SOLAPI).
   * When provided, it takes precedence over `page`.
   */
  startKey?: string;
  phone?: string;
  requestNo?: string;
  companyId?: string;
}

export interface HistoryItem {
  providerId: string;
  channel: HistoryChannel;
  messageId: string;
  to?: string;
  from?: string;
  status?: string;
  statusCode?: string;
  statusMessage?: string;
  sentAt?: Date;
  raw: unknown;
}

export interface HistoryResult {
  providerId: string;
  channel: HistoryChannel;
  totalCount: number;
  /**
   * Cursor key for fetching the next page when provider supports cursor pagination.
   */
  nextKey?: string | null;
  items: HistoryItem[];
  raw?: unknown;
}
