/**
 * Registry Type Definitions
 */

import type { FieldCryptoConfig } from "@k-msg/core";
import type { FileStorageAdapter } from "../shared/file-storage";
import type { WebhookEventType } from "../types/webhook.types";

export interface EndpointFilter {
  status?: "active" | "inactive" | "error" | "suspended";
  events?: WebhookEventType[];
  providerId?: string[];
  channelId?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  lastTriggeredAfter?: Date;
  lastTriggeredBefore?: Date;
}

export interface DeliveryFilter {
  endpointId?: string;
  eventId?: string;
  status?: "pending" | "success" | "failed" | "exhausted";
  createdAfter?: Date;
  createdBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
  httpStatusCode?: number[];
  hasError?: boolean;
}

export interface EventFilter {
  type?: WebhookEventType[];
  providerId?: string[];
  channelId?: string[];
  templateId?: string[];
  messageId?: string[];
  userId?: string[];
  organizationId?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface StorageConfig {
  type: "memory" | "file" | "database";

  // File storage options
  filePath?: string;
  fileAdapter?: FileStorageAdapter;
  enableCompression?: boolean;
  maxFileSize?: number;

  // Database options
  connectionString?: string;
  tableName?: string;

  // Memory options
  maxMemoryUsage?: number;

  // Common options
  retentionDays?: number;
  /**
   * Preferred option. If both legacy and `fieldCrypto` are set, `fieldCrypto` takes precedence.
   */
  fieldCrypto?: FieldCryptoConfig;
  /**
   * @deprecated Use `fieldCrypto` instead.
   */
  enableEncryption?: boolean;
  /**
   * @deprecated Use `fieldCrypto` with a provider implementation.
   * Legacy option kept for compatibility only.
   */
  encryptionKey?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
