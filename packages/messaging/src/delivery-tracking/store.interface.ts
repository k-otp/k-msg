import type {
  FieldCryptoCircuitState,
  FieldCryptoConfig,
  FieldCryptoControlSignalEvent,
  FieldCryptoMetricEvent,
  MaybePromise,
} from "@k-msg/core";
import type { TrackingRecord } from "./types";

export type DeliveryTrackingRecordOrderBy = "requestedAt" | "statusUpdatedAt";
export type DeliveryTrackingRecordOrderDirection = "asc" | "desc";

export interface DeliveryTrackingRecordFilter {
  messageId?: string | string[];
  providerId?: string | string[];
  providerMessageId?: string | string[];
  type?: TrackingRecord["type"] | Array<TrackingRecord["type"]>;
  status?: TrackingRecord["status"] | Array<TrackingRecord["status"]>;
  to?: string | string[];
  toHash?: string | string[];
  from?: string | string[];
  fromHash?: string | string[];
  requestedAtFrom?: Date;
  requestedAtTo?: Date;
  statusUpdatedAtFrom?: Date;
  statusUpdatedAtTo?: Date;
}

export interface DeliveryTrackingListOptions
  extends DeliveryTrackingRecordFilter {
  limit: number;
  offset?: number;
  orderBy?: DeliveryTrackingRecordOrderBy;
  orderDirection?: DeliveryTrackingRecordOrderDirection;
}

export type DeliveryTrackingCountByField = "providerId" | "type" | "status";

export type DeliveryTrackingCountByKey = Partial<
  Record<DeliveryTrackingCountByField, string>
>;

export interface DeliveryTrackingCountByRow {
  key: DeliveryTrackingCountByKey;
  count: number;
}

export type DeliveryTrackingRetentionClass =
  | "opsLogs"
  | "telecomMetadata"
  | "billingEvidence";

export interface DeliveryTrackingRetentionPreset {
  opsLogsDays: number;
  telecomMetadataDays: number;
  billingEvidenceDays: number;
}

export interface DeliveryTrackingRetentionConfig {
  preset?: "kr-b2b-baseline";
  tenantOverrideDays?: Partial<Record<DeliveryTrackingRetentionClass, number>>;
  contractOverrideResolver?: (context: {
    tenantId?: string;
    record: TrackingRecord;
    defaultDays: number;
    retentionClass: DeliveryTrackingRetentionClass;
  }) => number | undefined | Promise<number | undefined>;
}

export interface DeliveryTrackingFieldCryptoOptions {
  config: FieldCryptoConfig;
  tenantId?: string;
  metrics?: (
    event: FieldCryptoMetricEvent & {
      store: "sql" | "object" | "memory";
      tableName?: string;
    },
  ) => void | Promise<void>;
  controlSignal?: DeliveryTrackingFieldCryptoControlSignalOptions;
}

export interface DeliveryTrackingCryptoOperationContext {
  operation: "encrypt" | "decrypt" | "hash";
  tenantId?: string;
  providerId?: string;
  kid?: string;
  tableName?: string;
  store: "sql" | "object" | "memory";
  messageId?: string;
}

export interface DeliveryTrackingCryptoController {
  beforeOperation?(
    context: DeliveryTrackingCryptoOperationContext,
  ): MaybePromise<{
    allowed: boolean;
    state: FieldCryptoCircuitState;
  }>;
  onSuccess?(
    context: DeliveryTrackingCryptoOperationContext,
  ): MaybePromise<void>;
  onFailure?(
    context: DeliveryTrackingCryptoOperationContext & {
      error: unknown;
      errorClass?: string;
    },
  ): MaybePromise<void>;
}

export interface DeliveryTrackingFieldCryptoControlSignalOptions {
  enabled?: boolean;
  scopeBy?: "tenant_provider_kid" | "tenant_provider";
  failureThreshold?: number;
  windowMs?: number;
  cooldownMs?: number;
  controller?: DeliveryTrackingCryptoController;
  onStateChange?: (
    event: FieldCryptoControlSignalEvent,
  ) => void | Promise<void>;
  runbookTrigger?: (
    event: FieldCryptoControlSignalEvent,
  ) => void | Promise<void>;
}

export interface DeliveryTrackingStore {
  init(): Promise<void>;
  upsert(record: TrackingRecord): Promise<void>;
  get(messageId: string): Promise<TrackingRecord | undefined>;
  listDue(now: Date, limit: number): Promise<TrackingRecord[]>;
  listRecords?(options: DeliveryTrackingListOptions): Promise<TrackingRecord[]>;
  countRecords?(filter: DeliveryTrackingRecordFilter): Promise<number>;
  countBy?(
    filter: DeliveryTrackingRecordFilter,
    groupBy: readonly DeliveryTrackingCountByField[],
  ): Promise<DeliveryTrackingCountByRow[]>;
  patch(messageId: string, patch: Partial<TrackingRecord>): Promise<void>;
  close?(): Promise<void> | void;
}
