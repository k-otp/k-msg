import {
  assertFieldCryptoConfig,
  createDefaultMasker,
  type FieldCryptoCircuitState,
  type FieldCryptoConfig,
  FieldCryptoError,
  type FieldCryptoKeyContext,
  type FieldCryptoMetricEvent,
  type FieldCryptoOpenFallback,
  type FieldMode,
  normalizeKidList,
  normalizePhoneForHash,
  resolveFieldCryptoFailMode,
  resolveFieldCryptoOpenFallback,
  resolveFieldDecryptKids,
  resolveFieldEncryptKid,
  resolveFieldMode,
  toCiphertextEnvelopeString,
} from "@k-msg/core";
import { createCryptoCircuitController } from "./crypto-control-plane";
import type {
  DeliveryTrackingCryptoController,
  DeliveryTrackingCryptoOperationContext,
  DeliveryTrackingFieldCryptoOptions,
  DeliveryTrackingRecordFilter,
} from "./store.interface";
import type { TrackingRecord } from "./types";

export interface TrackingCryptoColumns {
  toEnc?: string;
  toHash?: string;
  toMasked?: string;
  fromEnc?: string;
  fromHash?: string;
  fromMasked?: string;
  metadataEnc?: string;
  metadataHashes?: Record<string, string>;
  metadata?: Record<string, unknown>;
  cryptoKid?: string;
  cryptoVersion?: number;
  cryptoState?: TrackingRecord["cryptoState"];
}

export interface TrackingCryptoMode {
  secureMode: boolean;
  compatPlainColumns: boolean;
}

/** The record fields the write path reads to derive the secure columns. */
export type TrackingCryptoWriteInput = Pick<
  TrackingRecord,
  "messageId" | "providerId" | "to" | "from" | "metadata"
>;

type CryptoOperation = "encrypt" | "decrypt" | "hash";

interface ScalarProtection {
  plaintext: string;
  encrypted?: string;
  hash?: string;
  masked?: string;
  kid?: string;
}

const DEFAULT_TO_MODE: FieldMode = "encrypt+hash";
const DEFAULT_FROM_MODE: FieldMode = "encrypt+hash";
const DEFAULT_METADATA_MODE: FieldMode = "plain";
const validatedConfigs = new WeakSet<FieldCryptoConfig>();
const controlPlaneByOptions = new WeakMap<
  DeliveryTrackingFieldCryptoOptions,
  DeliveryTrackingCryptoController
>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nowMs(): number {
  return Date.now();
}

function resolveConfig(
  options: DeliveryTrackingFieldCryptoOptions | undefined,
): FieldCryptoConfig | undefined {
  if (!options?.config) return undefined;
  if (options.config.enabled === false) return undefined;
  if (!validatedConfigs.has(options.config)) {
    assertFieldCryptoConfig(options.config);
    validatedConfigs.add(options.config);
  }
  return options.config;
}

function classifyCryptoOperationError(error: unknown): string | undefined {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (!message) return undefined;

  const normalized = message.toLowerCase();
  if (normalized.includes("aad")) return "aad_mismatch";
  if (normalized.includes("kid")) return "kid_mismatch";
  if (
    normalized.includes("key") ||
    normalized.includes("kms") ||
    normalized.includes("vault")
  ) {
    return "key_error";
  }
  return "crypto_error";
}

function resolveController(
  options: DeliveryTrackingFieldCryptoOptions | undefined,
): DeliveryTrackingCryptoController | undefined {
  if (!options?.controlSignal?.enabled) {
    return options?.controlSignal?.controller;
  }

  if (options.controlSignal.controller) {
    return options.controlSignal.controller;
  }

  const cached = controlPlaneByOptions.get(options);
  if (cached) return cached;

  const created = createCryptoCircuitController(options.controlSignal);
  controlPlaneByOptions.set(options, created);
  return created;
}

function toOperationContext(
  context: {
    tableName: string;
    store: "sql" | "object" | "memory";
    tenantId?: string;
    providerId?: string;
    messageId?: string;
  },
  operation: "encrypt" | "decrypt" | "hash",
  kid?: string,
): DeliveryTrackingCryptoOperationContext {
  return {
    operation,
    tenantId: context.tenantId,
    providerId: context.providerId,
    kid,
    tableName: context.tableName,
    store: context.store,
    messageId: context.messageId,
  };
}

async function emitCircuitStateMetric(
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  context: {
    tableName: string;
    store: "sql" | "object" | "memory";
  },
  state: FieldCryptoCircuitState,
  operation: "encrypt" | "decrypt" | "hash",
): Promise<void> {
  await emitMetric(
    options,
    {
      name: "crypto_circuit_state",
      value: state === "open" ? 1 : state === "half-open" ? 0.5 : 0,
      tags: {
        state,
        operation,
      },
    },
    context.tableName,
    context.store,
  );
}

function shouldEncrypt(mode: FieldMode): boolean {
  return mode === "encrypt" || mode === "encrypt+hash";
}

function shouldHash(mode: FieldMode): boolean {
  return mode === "encrypt+hash";
}

function maskValue(
  config: FieldCryptoConfig,
  path: string,
  value: string,
): Promise<string> | string {
  if (typeof config.provider.mask === "function") {
    return config.provider.mask({ value, path });
  }
  return createDefaultMasker()(value);
}

function buildAad(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext & Record<string, unknown>,
  path: string,
): Record<string, string> {
  const keys =
    config.aadFields ??
    ([
      "messageId",
      "providerId",
      "tableName",
      "fieldPath",
      "tenantId",
    ] as const);
  const aad: Record<string, string> = { fieldPath: path };
  for (const key of keys) {
    const value = context[key];
    if (typeof value === "string" && value.length > 0) {
      aad[key] = value;
    }
  }
  if (!aad.fieldPath) {
    aad.fieldPath = path;
  }
  return aad;
}

/** Resolves a field's encrypt kid for one write, at most once per field. */
type FieldKidResolver = (fieldPath: string) => Promise<string | undefined>;

function createFieldKidResolver(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext,
): FieldKidResolver {
  const kids = new Map<string, Promise<string | undefined>>();
  return (fieldPath) => {
    let kid = kids.get(fieldPath);
    if (!kid) {
      kid = resolveFieldEncryptKid(config, { ...context, fieldPath });
      kids.set(fieldPath, kid);
    }
    return kid;
  };
}

// The hash a record stores for `to` or `from` and the hash a lookup compares
// with it: both must come from here so they cannot drift apart.
function hashFieldValue(
  config: FieldCryptoConfig,
  path: string,
  value: string,
  kid: string | undefined,
): Promise<string> | string {
  return config.provider.hash({
    value: normalizePhoneForHash(value),
    path,
    ...(kid ? { kid } : {}),
  });
}

type LookupScope = Pick<FieldCryptoKeyContext, "providerId" | "messageId">;

function distinctScopeValues(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      ),
    ),
  ];
}

// A write resolves its keys with the record's providerId and messageId, and a
// resolver may scope keys by either. A lookup spans records, so it resolves
// keys for each provider and message the filter pins (each pair when it pins
// both), then for the whole store. Scoped contexts go first, so a resolver
// that caches one key set does not answer them with the unscoped one.
function resolveLookupScopes(
  filter: DeliveryTrackingRecordFilter,
): LookupScope[] {
  const providerIds = distinctScopeValues(filter.providerId);
  const messageIds = distinctScopeValues(filter.messageId);
  const scopes: LookupScope[] = [];
  if (providerIds.length > 0 && messageIds.length > 0) {
    for (const providerId of providerIds) {
      for (const messageId of messageIds) {
        scopes.push({ providerId, messageId });
      }
    }
  } else {
    for (const providerId of providerIds) scopes.push({ providerId });
    for (const messageId of messageIds) scopes.push({ messageId });
  }
  scopes.push({});
  return scopes;
}

// A record's hashes use the kid that encrypted it, which a lookup cannot know,
// so it tries every key a record's hash may use: the kid a write resolves now,
// the decrypt set, each for every scope, and the provider's default hash key
// (`undefined`), which writes use without a resolved kid. Each source resolves
// on its own, so a failing one, reported through onError, drops only its own
// candidates.
async function resolveLookupKids(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext,
  scopes: readonly LookupScope[],
  onError: (error: unknown) => void,
): Promise<Array<string | undefined>> {
  const kids: Array<string | undefined> = [];
  const add = (kid: string | undefined) => {
    if (!kids.includes(kid)) kids.push(kid);
  };

  const resolver = config.keyResolver;
  if (resolver) {
    for (const scope of scopes) {
      const scoped = { ...context, ...scope };
      try {
        add(await resolveFieldEncryptKid(config, scoped));
      } catch (error) {
        onError(error);
      }
      if (resolver.resolveDecryptKeys) {
        try {
          const decryptKids = await resolver.resolveDecryptKeys(scoped);
          for (const kid of normalizeKidList(decryptKids)) add(kid);
        } catch (error) {
          onError(error);
        }
      }
    }
  }
  add(undefined);
  return kids;
}

async function emitMetric(
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  event: FieldCryptoMetricEvent,
  tableName: string,
  store: "sql" | "object" | "memory",
): Promise<void> {
  if (!options?.metrics) return;
  await options.metrics({
    ...event,
    tableName,
    store,
  });
}

function failOrOpen(
  config: FieldCryptoConfig,
  operation: CryptoOperation,
  path: string,
  error: unknown,
): never {
  const failMode = resolveFieldCryptoFailMode(config);
  if (failMode === "open") {
    throw new FieldCryptoError(
      "policy",
      "fail-open path should be handled by caller",
      {
        operation,
        path,
      },
      {
        fieldPath: path,
        failMode,
        openFallback: resolveFieldCryptoOpenFallback(config),
        causeChain: [error],
      },
    );
  }

  const kind =
    operation === "encrypt"
      ? "encrypt"
      : operation === "decrypt"
        ? "decrypt"
        : "hash";
  throw new FieldCryptoError(
    kind,
    `Field crypto ${operation} failed for ${path}`,
    {
      operation,
      path,
      cause:
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : String(error),
    },
    {
      fieldPath: path,
      failMode: "closed",
      causeChain: [error],
    },
  );
}

function resolveScalarMode(
  config: FieldCryptoConfig,
  path: "to" | "from",
): FieldMode {
  return resolveFieldMode(
    config,
    path,
    path === "to" ? DEFAULT_TO_MODE : DEFAULT_FROM_MODE,
  );
}

async function protectScalar(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext & Record<string, unknown>,
  path: "to" | "from",
  value: string,
  resolveKid: FieldKidResolver,
): Promise<ScalarProtection> {
  const mode = resolveScalarMode(config, path);

  if (mode === "plain") {
    return {
      plaintext: value,
      masked: await maskValue(config, path, value),
    };
  }

  if (mode === "mask") {
    const masked = await maskValue(config, path, value);
    return {
      plaintext: masked,
      masked,
    };
  }

  const aad = buildAad(config, context, path);
  const kid = await resolveKid(path);

  const encrypted = await config.provider.encrypt({
    value,
    aad,
    path,
    ...(kid ? { kid } : {}),
  });

  const hash =
    shouldHash(mode) || path === "to" || path === "from"
      ? await hashFieldValue(config, path, value, kid)
      : undefined;
  const masked = await maskValue(config, path, value);

  return {
    plaintext: value,
    encrypted: toCiphertextEnvelopeString(encrypted.ciphertext),
    hash,
    masked,
    kid: encrypted.kid ?? kid,
  };
}

async function revealScalar(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext & Record<string, unknown>,
  path: string,
  encrypted: string,
): Promise<string> {
  const aad = buildAad(config, context, path);
  const candidateKids = await resolveFieldDecryptKids(config, {
    ...context,
    fieldPath: path,
    ciphertext: encrypted,
  });

  return await config.provider.decrypt({
    ciphertext: encrypted,
    aad,
    path,
    ...(candidateKids ? { candidateKids } : {}),
  });
}

function parseMetadataPath(path: string): string[] {
  const normalized = path.replace(/^metadata\.?/, "");
  if (normalized.length === 0) return [];
  return normalized.split(".").flatMap((segment) => {
    if (segment.endsWith("[*]")) {
      const key = segment.slice(0, -3);
      return key.length > 0 ? [key, "*"] : ["*"];
    }
    return [segment];
  });
}

function collectPathValues(
  value: unknown,
  segments: string[],
  index: number,
  output: string[],
): void {
  if (index >= segments.length) {
    if (typeof value === "string") {
      output.push(value);
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      output.push(String(value));
    }
    return;
  }

  const segment = segments[index];
  if (segment === "*") {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectPathValues(item, segments, index + 1, output);
      }
    }
    return;
  }

  if (!isObject(value)) return;
  collectPathValues(value[segment], segments, index + 1, output);
}

async function buildMetadataHashes(
  config: FieldCryptoConfig,
  metadata: Record<string, unknown>,
  resolveKid: FieldKidResolver,
): Promise<Record<string, string> | undefined> {
  const hashes: Record<string, string> = {};
  for (const [path, mode] of Object.entries(config.fields)) {
    if (!path.startsWith("metadata")) continue;
    if (mode !== "encrypt+hash") continue;

    const values: string[] = [];
    collectPathValues(metadata, parseMetadataPath(path), 0, values);
    if (values.length === 0) continue;

    const joined = values
      .map((value) => normalizePhoneForHash(value))
      .join(",");
    // Hashed under the key that encrypts metadata, as `to` and `from` are
    // under theirs, so a tenant or rotated key covers every hash in a record.
    const kid = await resolveKid("metadata");
    hashes[path] = await config.provider.hash({
      value: joined,
      path,
      ...(kid ? { kid } : {}),
    });
  }
  return Object.keys(hashes).length > 0 ? hashes : undefined;
}

// A degraded row keeps the lookup hash a normal write would store, under the
// same kid, so lookups still find it. When the kid does not resolve or cannot
// hash, the provider's default key, which lookups also search, stands in. The
// fallback must not throw, so a hash it cannot compute at all is left out.
async function hashDegradedField(
  config: FieldCryptoConfig,
  path: "to" | "from",
  value: string,
  resolveKid: FieldKidResolver,
): Promise<string | undefined> {
  if (!shouldEncrypt(resolveScalarMode(config, path))) return undefined;
  const kid = await resolveKid(path).catch(() => undefined);
  for (const candidate of kid ? [kid, undefined] : [undefined]) {
    try {
      return await hashFieldValue(config, path, value, candidate);
    } catch {
      // Try the next key.
    }
  }
  return undefined;
}

function toFallbackValue(
  fallback: FieldCryptoOpenFallback,
  plaintext: string,
  masked: string,
): string {
  if (fallback === "plaintext") return plaintext;
  if (fallback === "masked") return masked;
  return "";
}

/**
 * @evidence docs/security/field-crypto-v1.md#field-policy-modes
 *   Applies each field's mode when a tracking record is written, and also
 *   hashes to and from in encrypt mode for recipient and sender lookups.
 * @evidenceReview docs/security/field-crypto-v1.md#field-policy-modes #d6936dd
 *   Read protectScalar: plain and mask write no ciphertext, encrypt and
 *   encrypt+hash add the mask, and the hash is written for encrypt+hash and,
 *   for to and from, for encrypt too; metadata hashes need encrypt+hash.
 * @evidence docs/security/field-crypto-v1.md#key-management
 *   Encrypts and hashes each field under the kid resolveEncryptKey returns for
 *   it, and has a degraded write hash to and from under the same kids.
 * @evidenceReview docs/security/field-crypto-v1.md#key-management #b219abe
 *   Read protectScalar, buildMetadataHashes, and hashDegradedField: hashes use
 *   the kid resolved, with the record's providerId and messageId, for to, from,
 *   or metadata, else the default key, and the fallback retries with the
 *   default key before storing an empty to hash. Ran the tenant-key, metadata,
 *   and degraded-write tests on both stores. Re-read after the decrypt rule
 *   was added: writes resolve kids through core's resolveFieldEncryptKid, the
 *   same body as the local helper it replaced.
 */
export async function applyTrackingCryptoOnWrite(
  record: TrackingCryptoWriteInput,
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  context: FieldCryptoKeyContext & {
    tableName: string;
    store: "sql" | "object" | "memory";
  },
  mode: TrackingCryptoMode,
): Promise<TrackingCryptoColumns> {
  const config = resolveConfig(options);
  if (!config) {
    return {
      metadata: record.metadata,
      cryptoState: "plain",
    };
  }

  const started = nowMs();
  const fallback = resolveFieldCryptoOpenFallback(config);
  const failMode = resolveFieldCryptoFailMode(config);
  const keyContext = {
    ...context,
    messageId: record.messageId,
    providerId: record.providerId,
    tenantId: options?.tenantId ?? context.tenantId,
  };
  const controller = resolveController(options);
  const baseOperationContext = toOperationContext(
    {
      tableName: context.tableName,
      store: context.store,
      tenantId: keyContext.tenantId,
      providerId: keyContext.providerId,
      messageId: keyContext.messageId,
    },
    "encrypt",
  );

  if (controller) {
    const gate = controller.beforeOperation
      ? await controller.beforeOperation(baseOperationContext)
      : { allowed: true, state: "closed" as const };
    await emitCircuitStateMetric(options, context, gate.state, "encrypt");
    if (!gate.allowed) {
      await emitMetric(
        options,
        {
          name: "crypto_circuit_open_count",
          value: 1,
          tags: {
            operation: "encrypt",
          },
        },
        context.tableName,
        context.store,
      );
      throw new FieldCryptoError(
        "policy",
        "crypto circuit is open for encrypt operation",
        {
          operation: "encrypt",
          path: "to",
        },
        {
          fieldPath: "to",
          failMode,
          openFallback: fallback,
        },
      );
    }
  }

  let activeKid: string | undefined;
  // Shared with the fail-open fallback below, so a degraded row hashes under
  // the kid this write resolved.
  const resolveKid = createFieldKidResolver(config, keyContext);

  try {
    const toProtected = await protectScalar(
      config,
      keyContext,
      "to",
      record.to,
      resolveKid,
    );
    if (toProtected.kid) {
      activeKid = toProtected.kid;
      await emitMetric(
        options,
        {
          name: "key_kid_usage",
          value: 1,
          kid: activeKid,
        },
        context.tableName,
        context.store,
      );
    }

    const fromProtected =
      typeof record.from === "string" && record.from.length > 0
        ? await protectScalar(
            config,
            keyContext,
            "from",
            record.from,
            resolveKid,
          )
        : undefined;

    const metadataMode = resolveFieldMode(
      config,
      "metadata",
      DEFAULT_METADATA_MODE,
    );
    const metadataHashes =
      record.metadata && isObject(record.metadata)
        ? await buildMetadataHashes(config, record.metadata, resolveKid)
        : undefined;

    let metadataEnc: string | undefined;
    if (record.metadata && shouldEncrypt(metadataMode)) {
      const metadataString = JSON.stringify(record.metadata);
      // Metadata takes the resolved key like the recipient and sender, or a
      // tenant or rotated key would cover only some of the record.
      const kid = await resolveKid("metadata");
      const encrypted = await config.provider.encrypt({
        value: metadataString,
        aad: buildAad(config, keyContext, "metadata"),
        path: "metadata",
        ...(kid ? { kid } : {}),
      });
      metadataEnc = toCiphertextEnvelopeString(encrypted.ciphertext);
      if (!activeKid) {
        activeKid = encrypted.kid ?? kid;
      }
    }

    await emitMetric(
      options,
      {
        name: "crypto_encrypt_ms",
        value: nowMs() - started,
        kid: activeKid,
      },
      context.tableName,
      context.store,
    );
    if (controller) {
      await controller.onSuccess?.({
        ...baseOperationContext,
        kid: activeKid,
      });
      await emitCircuitStateMetric(options, context, "closed", "encrypt");
    }

    return {
      toEnc: toProtected.encrypted ?? toProtected.plaintext,
      toHash: toProtected.hash,
      toMasked: toProtected.masked,
      fromEnc: fromProtected?.encrypted ?? fromProtected?.plaintext,
      fromHash: fromProtected?.hash,
      fromMasked: fromProtected?.masked,
      metadataEnc,
      metadataHashes,
      metadata: mode.compatPlainColumns ? record.metadata : undefined,
      cryptoKid: activeKid,
      cryptoVersion: 1,
      cryptoState: "encrypted",
    };
  } catch (error) {
    const errorClass = classifyCryptoOperationError(error);
    if (controller) {
      await controller.onFailure?.({
        ...baseOperationContext,
        kid: activeKid,
        error,
        ...(errorClass ? { errorClass } : {}),
      });
      const gateAfterFailure = controller.beforeOperation
        ? await controller.beforeOperation(baseOperationContext)
        : { allowed: true, state: "closed" as const };
      await emitCircuitStateMetric(
        options,
        context,
        gateAfterFailure.state,
        "encrypt",
      );
      if (gateAfterFailure.state === "open") {
        await emitMetric(
          options,
          {
            name: "crypto_circuit_open_count",
            value: 1,
            tags: {
              operation: "encrypt",
            },
          },
          context.tableName,
          context.store,
        );
      }
    }

    await emitMetric(
      options,
      {
        name: "crypto_fail_count",
        value: 1,
        tags: {
          operation: "encrypt",
          failMode,
          fallback,
        },
      },
      context.tableName,
      context.store,
    );

    if (failMode === "closed") {
      failOrOpen(config, "encrypt", "to", error);
    }

    const toMasked = await maskValue(config, "to", record.to);
    const fromMasked =
      typeof record.from === "string" && record.from.length > 0
        ? await maskValue(config, "from", record.from)
        : undefined;

    if (fallback === "plaintext" && !config.unsafeAllowPlaintextStorage) {
      throw new FieldCryptoError(
        "policy",
        "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
        undefined,
        {
          fieldPath: "to",
          failMode: "open",
          openFallback: "plaintext",
        },
      );
    }

    const toEnc = toFallbackValue(fallback, record.to, toMasked);
    const fromPlain = record.from ?? "";
    const fromEnc =
      fromPlain.length > 0
        ? toFallbackValue(fallback, fromPlain, fromMasked ?? "")
        : undefined;

    return {
      toEnc,
      // The secure SQL schema requires a recipient hash as it does a
      // ciphertext. Like the "null" fallback's empty ciphertext, an empty hash
      // keeps the row storable, and no lookup matches it.
      toHash:
        (await hashDegradedField(config, "to", record.to, resolveKid)) ?? "",
      toMasked,
      fromEnc,
      fromHash:
        fromPlain.length > 0
          ? await hashDegradedField(config, "from", fromPlain, resolveKid)
          : undefined,
      fromMasked,
      metadata: mode.compatPlainColumns ? record.metadata : undefined,
      cryptoVersion: 1,
      cryptoState: "degraded",
    };
  }
}

export async function restoreTrackingCryptoOnRead(
  record: TrackingRecord,
  columns: TrackingCryptoColumns,
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  context: FieldCryptoKeyContext & {
    tableName: string;
    store: "sql" | "object" | "memory";
  },
  mode: TrackingCryptoMode,
): Promise<TrackingRecord> {
  const config = resolveConfig(options);
  if (!config) {
    return {
      ...record,
      ...(columns.toHash ? { toHash: columns.toHash } : {}),
      ...(columns.toMasked ? { toMasked: columns.toMasked } : {}),
      ...(columns.fromHash ? { fromHash: columns.fromHash } : {}),
      ...(columns.fromMasked ? { fromMasked: columns.fromMasked } : {}),
      ...(columns.metadataHashes
        ? { metadataHashes: columns.metadataHashes }
        : {}),
    };
  }

  const fallback = resolveFieldCryptoOpenFallback(config);
  const failMode = resolveFieldCryptoFailMode(config);
  const started = nowMs();

  const next: TrackingRecord = {
    ...record,
    ...(columns.toHash ? { toHash: columns.toHash } : {}),
    ...(columns.toMasked ? { toMasked: columns.toMasked } : {}),
    ...(columns.fromHash ? { fromHash: columns.fromHash } : {}),
    ...(columns.fromMasked ? { fromMasked: columns.fromMasked } : {}),
    ...(columns.metadataHashes
      ? { metadataHashes: columns.metadataHashes }
      : {}),
    ...(columns.cryptoKid ? { cryptoKid: columns.cryptoKid } : {}),
    ...(columns.cryptoVersion ? { cryptoVersion: columns.cryptoVersion } : {}),
    cryptoState: columns.cryptoState ?? "encrypted",
  };

  const keyContext = {
    ...context,
    messageId: record.messageId,
    providerId: record.providerId,
    tenantId: options?.tenantId ?? context.tenantId,
  };
  const controller = resolveController(options);
  const baseOperationContext = toOperationContext(
    {
      tableName: context.tableName,
      store: context.store,
      tenantId: keyContext.tenantId,
      providerId: keyContext.providerId,
      messageId: keyContext.messageId,
    },
    "decrypt",
    columns.cryptoKid,
  );

  if (controller) {
    const gate = controller.beforeOperation
      ? await controller.beforeOperation(baseOperationContext)
      : { allowed: true, state: "closed" as const };
    await emitCircuitStateMetric(options, context, gate.state, "decrypt");
    if (!gate.allowed) {
      await emitMetric(
        options,
        {
          name: "crypto_circuit_open_count",
          value: 1,
          tags: {
            operation: "decrypt",
          },
        },
        context.tableName,
        context.store,
      );
      throw new FieldCryptoError(
        "policy",
        "crypto circuit is open for decrypt operation",
        {
          operation: "decrypt",
          path: "to",
        },
        {
          fieldPath: "to",
          failMode,
          openFallback: fallback,
        },
      );
    }
  }

  try {
    const toMode = resolveFieldMode(config, "to", DEFAULT_TO_MODE);
    if (shouldEncrypt(toMode) && typeof columns.toEnc === "string") {
      next.to = await revealScalar(config, keyContext, "to", columns.toEnc);
    } else if (typeof columns.toEnc === "string" && columns.toEnc.length > 0) {
      next.to = columns.toEnc;
    }

    const fromMode = resolveFieldMode(config, "from", DEFAULT_FROM_MODE);
    if (typeof columns.fromEnc === "string" && columns.fromEnc.length > 0) {
      if (shouldEncrypt(fromMode)) {
        next.from = await revealScalar(
          config,
          keyContext,
          "from",
          columns.fromEnc,
        );
      } else {
        next.from = columns.fromEnc;
      }
    }

    if (
      typeof columns.metadataEnc === "string" &&
      columns.metadataEnc.length > 0
    ) {
      const metadataRaw = await revealScalar(
        config,
        keyContext,
        "metadata",
        columns.metadataEnc,
      );
      const parsed = JSON.parse(metadataRaw) as unknown;
      if (isObject(parsed)) {
        next.metadata = parsed;
      }
    } else if (columns.metadata && mode.compatPlainColumns) {
      next.metadata = columns.metadata;
    }

    await emitMetric(
      options,
      {
        name: "crypto_decrypt_ms",
        value: nowMs() - started,
        kid: columns.cryptoKid ?? undefined,
      },
      context.tableName,
      context.store,
    );
    if (controller) {
      await controller.onSuccess?.(baseOperationContext);
      await emitCircuitStateMetric(options, context, "closed", "decrypt");
    }

    return next;
  } catch (error) {
    const errorClass = classifyCryptoOperationError(error);
    if (controller) {
      await controller.onFailure?.({
        ...baseOperationContext,
        error,
        ...(errorClass ? { errorClass } : {}),
      });
      const gateAfterFailure = controller.beforeOperation
        ? await controller.beforeOperation(baseOperationContext)
        : { allowed: true, state: "closed" as const };
      await emitCircuitStateMetric(
        options,
        context,
        gateAfterFailure.state,
        "decrypt",
      );
      if (gateAfterFailure.state === "open") {
        await emitMetric(
          options,
          {
            name: "crypto_circuit_open_count",
            value: 1,
            tags: {
              operation: "decrypt",
            },
          },
          context.tableName,
          context.store,
        );
      }
    }

    await emitMetric(
      options,
      {
        name: "crypto_fail_count",
        value: 1,
        tags: {
          operation: "decrypt",
          failMode,
          fallback,
        },
      },
      context.tableName,
      context.store,
    );

    if (failMode === "closed") {
      failOrOpen(config, "decrypt", "to", error);
    }

    const toMasked =
      columns.toMasked ?? (await maskValue(config, "to", next.to));
    next.to = toFallbackValue(fallback, columns.toEnc ?? next.to, toMasked);

    const fromBase = columns.fromEnc ?? next.from ?? "";
    if (fromBase.length > 0) {
      const fromMasked =
        columns.fromMasked ?? (await maskValue(config, "from", fromBase));
      next.from = toFallbackValue(fallback, fromBase, fromMasked);
    }

    if (fallback === "plaintext" && !config.unsafeAllowPlaintextStorage) {
      throw new FieldCryptoError(
        "policy",
        "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
        undefined,
        {
          fieldPath: "to",
          failMode: "open",
          openFallback: "plaintext",
        },
      );
    }

    if (columns.metadata && mode.compatPlainColumns) {
      next.metadata = columns.metadata;
    }
    next.cryptoState = "degraded";
    return next;
  }
}

// Hashes each lookup value under every candidate kid. Under failMode=open a
// candidate or hash that cannot be computed is skipped, so the lookup may find
// fewer records; under failMode=closed it fails the lookup.
async function hashLookupValues(
  config: FieldCryptoConfig,
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  context: FieldCryptoKeyContext & {
    tableName: string;
    store: "sql" | "object" | "memory";
  },
  scopes: readonly LookupScope[],
  path: "to" | "from",
  values: readonly string[],
): Promise<string[]> {
  let failure: { error: unknown } | undefined;
  const onError = (error: unknown) => {
    failure ??= { error };
  };

  const kids = await resolveLookupKids(
    config,
    { ...context, fieldPath: path },
    scopes,
    onError,
  );
  const results = await Promise.allSettled(
    values.flatMap((value) =>
      kids.map(async (kid) => hashFieldValue(config, path, value, kid)),
    ),
  );
  const hashes = new Set<string>();
  for (const result of results) {
    if (result.status === "rejected") {
      onError(result.reason);
    } else if (result.value) {
      // An empty hash would match the degraded rows stored without one.
      hashes.add(result.value);
    }
  }

  if (failure) {
    const failMode = resolveFieldCryptoFailMode(config);
    await emitMetric(
      options,
      {
        name: "crypto_fail_count",
        value: 1,
        tags: {
          operation: "hash",
          failMode,
        },
      },
      context.tableName,
      context.store,
    );
    if (failMode === "closed") {
      failOrOpen(config, "hash", path, failure.error);
    }
  }
  return [...hashes];
}

/**
 * Replaces `to` and `from` filter values with their lookup hashes. Resolves to
 * `undefined` when no record can match: a secure-mode lookup whose values
 * could not be hashed under failMode=open.
 *
 * @evidence docs/security/field-crypto-v1.md#key-management
 *   Hashes each to and from filter value under the encrypt kid and the decrypt
 *   set, resolved for every scope the filter pins and for the whole store, and
 *   under the provider's default key, and handles a key or hash it cannot
 *   resolve or compute as the fail mode directs.
 * @evidenceReview docs/security/field-crypto-v1.md#key-management #b219abe
 *   Read resolveLookupScopes, resolveLookupKids, and hashLookupValues against
 *   the lookup and failure paragraphs: pinned scopes first, then the store,
 *   each key source resolved on its own, no empty hash, and no records for an
 *   undefined filter. Ran the scoped, rotation, pre-resolver, candidate, and
 *   fail-mode lookup tests. Re-read after the decrypt rule was added: lookups
 *   use core's resolveFieldEncryptKid and normalizeKidList, unchanged bodies.
 */
export async function normalizeTrackingFilterWithHashes(
  filter: DeliveryTrackingRecordFilter,
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  mode: TrackingCryptoMode,
  context: FieldCryptoKeyContext & {
    tableName: string;
    store: "sql" | "object" | "memory";
  },
): Promise<DeliveryTrackingRecordFilter | undefined> {
  const config = resolveConfig(options);
  if (!config) return filter;

  const keyContext = {
    ...context,
    tenantId: options?.tenantId ?? context.tenantId,
  };
  const scopes = resolveLookupScopes(filter);
  // Secure mode without plain columns can match only by hash.
  const hashOnly = mode.secureMode && !mode.compatPlainColumns;
  const next: DeliveryTrackingRecordFilter = { ...filter };

  const lookupFields = [
    ["to", "toHash"],
    ["from", "fromHash"],
  ] as const;
  for (const [path, hashKey] of lookupFields) {
    const plain = next[path];
    if (next[hashKey] || !plain) continue;

    const values = Array.isArray(plain) ? plain : [plain];
    const hashes = await hashLookupValues(
      config,
      options,
      keyContext,
      scopes,
      path,
      values,
    );
    if (hashes.length > 0) {
      next[hashKey] = hashes.length === 1 ? hashes[0] : hashes;
    }
    if (hashOnly) {
      // Dropping the plain values without a hash would match every record.
      if (values.length > 0 && hashes.length === 0) return undefined;
      next[path] = undefined;
    }
  }

  return next;
}
