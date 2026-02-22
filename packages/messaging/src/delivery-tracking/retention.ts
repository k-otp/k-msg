import type {
  DeliveryTrackingRetentionClass,
  DeliveryTrackingRetentionConfig,
  DeliveryTrackingRetentionPreset,
} from "./store.interface";
import type { TrackingRecord } from "./types";

export const KR_B2B_BASELINE_RETENTION_DAYS: DeliveryTrackingRetentionPreset = {
  opsLogsDays: 90,
  telecomMetadataDays: 365,
  billingEvidenceDays: 1825,
};

function resolvePresetDays(
  retentionClass: DeliveryTrackingRetentionClass,
  preset?: DeliveryTrackingRetentionPreset,
): number {
  const target = preset ?? KR_B2B_BASELINE_RETENTION_DAYS;
  switch (retentionClass) {
    case "opsLogs":
      return target.opsLogsDays;
    case "telecomMetadata":
      return target.telecomMetadataDays;
    case "billingEvidence":
      return target.billingEvidenceDays;
  }
}

export async function resolveRetentionDays(
  config: DeliveryTrackingRetentionConfig | undefined,
  context: {
    tenantId?: string;
    record: TrackingRecord;
    retentionClass: DeliveryTrackingRetentionClass;
  },
): Promise<number> {
  const preset =
    config?.preset === "kr-b2b-baseline"
      ? KR_B2B_BASELINE_RETENTION_DAYS
      : KR_B2B_BASELINE_RETENTION_DAYS;

  const baseline = resolvePresetDays(context.retentionClass, preset);
  const tenantOverride = config?.tenantOverrideDays?.[context.retentionClass];
  const defaultDays =
    typeof tenantOverride === "number" && tenantOverride > 0
      ? tenantOverride
      : baseline;

  if (!config?.contractOverrideResolver) {
    return defaultDays;
  }

  const contractDays = await config.contractOverrideResolver({
    tenantId: context.tenantId,
    record: context.record,
    defaultDays,
    retentionClass: context.retentionClass,
  });
  if (typeof contractDays === "number" && contractDays > 0) {
    return contractDays;
  }
  return defaultDays;
}

export function toRetentionBucketYm(value: Date): number {
  const year = value.getUTCFullYear();
  const month = value.getUTCMonth() + 1;
  return year * 100 + month;
}
