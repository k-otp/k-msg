import type {
  DeliveryTrackingRetentionClass,
  DeliveryTrackingRetentionConfig,
  DeliveryTrackingRetentionPreset,
} from "./store.interface";
import type { TrackingRecord } from "./types";

/**
 * Retention days of the `kr-b2b-baseline` preset.
 *
 * @evidence docs/compliance/kr-b2b-retention.md#default-preset-kr-b2b-baseline
 *   Encodes the 90, 365, and 1825 day baseline for each retention class.
 * @evidenceReview docs/compliance/kr-b2b-retention.md#default-preset-kr-b2b-baseline #41344c3
 *   Compared the section's three durations with these values.
 */
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

/**
 * Resolves how many days a tracking record is retained.
 *
 * @evidence docs/compliance/kr-b2b-retention.md#contract-precedence
 *   A positive contractOverrideResolver result replaces both the tenant
 *   override and the preset days.
 * @evidenceReview docs/compliance/kr-b2b-retention.md#contract-precedence #f0e1afd
 *   Read this function: a positive resolver result wins over
 *   tenantOverrideDays and the preset, and anything else falls back.
 * @evidenceExclude docs/compliance/kr-b2b-retention.md#operational-guidance
 *   Deployment guidance for operators; the library exposes retention classes
 *   and buckets but cannot enforce these recommendations.
 * @evidenceExcludeReview docs/compliance/kr-b2b-retention.md#operational-guidance #857570b
 *   Checked all four bullets are deployment recommendations; field crypto
 *   and retention buckets are the library-side levers they rely on.
 */
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

/**
 * Computes the `retention_bucket_ym` partition value of a timestamp.
 *
 * @evidence docs/compliance/kr-b2b-retention.md#tracking-schema-fields
 *   Derives the UTC YYYYMM bucket stored beside retention_class for
 *   bucket-based cleanup.
 * @evidenceReview docs/compliance/kr-b2b-retention.md#tracking-schema-fields #2e54f1a
 *   Confirmed delivery-tracking-schema.ts maps retentionClass and
 *   retentionBucketYm to these columns and this helper uses UTC.
 */
export function toRetentionBucketYm(value: Date): number {
  const year = value.getUTCFullYear();
  const month = value.getUTCMonth() + 1;
  return year * 100 + month;
}
