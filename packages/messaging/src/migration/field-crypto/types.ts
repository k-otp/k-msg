import type { DeliveryTrackingFieldCryptoSchemaOptions } from "../../adapters/cloudflare/delivery-tracking-schema";

export type FieldCryptoMigrationRunStatus =
  | "planned"
  | "running"
  | "completed"
  | "failed";

export type FieldCryptoMigrationChunkStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface FieldCryptoMigrationStateTables {
  runsTableName?: string;
  chunksTableName?: string;
}

export interface FieldCryptoMigrationPlanInput
  extends FieldCryptoMigrationStateTables {
  trackingTableName?: string;
  chunkSize?: number;
  fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
}

export interface FieldCryptoMigrationPlan {
  planId: string;
  trackingTableName: string;
  chunkSize: number;
  totalRows: number;
  estimatedChunks: number;
  schemaFingerprint: string;
  createdAt: number;
}

export interface FieldCryptoMigrationRunRecord {
  planId: string;
  trackingTableName: string;
  schemaFingerprint: string;
  status: FieldCryptoMigrationRunStatus;
  chunkSize: number;
  totalRows: number;
  totalChunks: number;
  processedRows: number;
  processedChunks: number;
  failedChunks: number;
  cursorRequestedAt?: number;
  cursorMessageId?: string;
  createdAt: number;
  updatedAt: number;
  lastError?: string;
}

export interface FieldCryptoMigrationChunkRecord {
  planId: string;
  chunkNo: number;
  status: FieldCryptoMigrationChunkStatus;
  startRequestedAt?: number;
  startMessageId?: string;
  endRequestedAt?: number;
  endMessageId?: string;
  processedRows: number;
  attempts: number;
  messageIds?: readonly string[];
  lastError?: string;
  updatedAt: number;
}

export interface FieldCryptoMigrationApplyInput
  extends FieldCryptoMigrationStateTables {
  planId: string;
  trackingTableName?: string;
  maxChunks?: number;
  fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
}

export interface FieldCryptoMigrationRetryInput
  extends FieldCryptoMigrationStateTables {
  planId: string;
  trackingTableName?: string;
  maxChunks?: number;
  fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
}

export interface FieldCryptoMigrationApplyResult {
  planId: string;
  processedChunks: number;
  processedRows: number;
  failedChunks: number;
  status: FieldCryptoMigrationRunStatus;
  cursorRequestedAt?: number;
  cursorMessageId?: string;
}

export interface FieldCryptoMigrationStatus {
  run?: FieldCryptoMigrationRunRecord;
  chunks: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  updatedAt?: number;
}
