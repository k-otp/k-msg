import {
  assertFieldCryptoConfig,
  createDefaultMasker,
  type FieldCryptoCircuitState,
  type FieldCryptoConfig,
  FieldCryptoError,
  type FieldCryptoFailMode,
  type FieldCryptoKeyContext,
  type FieldCryptoMetricEvent,
  type FieldCryptoOpenFallback,
  type FieldMode,
  normalizePhoneForHash,
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

function resolveFailMode(config: FieldCryptoConfig): FieldCryptoFailMode {
  return config.failMode ?? "closed";
}

function resolveOpenFallback(
  config: FieldCryptoConfig,
): FieldCryptoOpenFallback {
  return config.openFallback ?? "masked";
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

async function resolveEncryptKid(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext,
): Promise<string | undefined> {
  if (!config.keyResolver) return undefined;
  const resolved = await config.keyResolver.resolveEncryptKey(context);
  if (!resolved || typeof resolved.kid !== "string" || !resolved.kid.trim()) {
    return undefined;
  }
  return resolved.kid.trim();
}

function extractEnvelopeKid(ciphertext: unknown): string | undefined {
  if (typeof ciphertext !== "string" || ciphertext.length === 0) {
    return undefined;
  }
  if (ciphertext[0] !== "{") return undefined;

  try {
    const parsed = JSON.parse(ciphertext) as { kid?: unknown };
    if (typeof parsed.kid !== "string") return undefined;
    const normalized = parsed.kid.trim();
    return normalized.length > 0 ? normalized : undefined;
  } catch {
    return undefined;
  }
}

async function resolveDecryptKids(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext & { ciphertext?: string },
): Promise<readonly string[] | undefined> {
  const envelopeKid = extractEnvelopeKid(context.ciphertext);
  if (!config.keyResolver?.resolveDecryptKeys) {
    return envelopeKid ? [envelopeKid] : undefined;
  }

  const resolved = await config.keyResolver.resolveDecryptKeys(context);
  const normalized = (Array.isArray(resolved) ? resolved : [])
    .filter((kid): kid is string => typeof kid === "string")
    .map((kid) => kid.trim())
    .filter((kid) => kid.length > 0);

  if (envelopeKid && !normalized.includes(envelopeKid)) {
    normalized.unshift(envelopeKid);
  }

  return normalized.length > 0 ? normalized : undefined;
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
  const failMode = resolveFailMode(config);
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
        openFallback: resolveOpenFallback(config),
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

async function protectScalar(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext & Record<string, unknown>,
  path: string,
  value: string,
): Promise<ScalarProtection> {
  const mode = resolveFieldMode(
    config,
    path,
    path === "to" ? DEFAULT_TO_MODE : DEFAULT_FROM_MODE,
  );

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
  const kid = await resolveEncryptKid(config, {
    ...context,
    fieldPath: path,
  });

  const encrypted = await config.provider.encrypt({
    value,
    aad,
    path,
    ...(kid ? { kid } : {}),
  });

  const hash =
    shouldHash(mode) || path === "to" || path === "from"
      ? await config.provider.hash({
          value: normalizePhoneForHash(value),
          path,
          ...(kid ? { kid } : {}),
        })
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
  const candidateKids = await resolveDecryptKids(config, {
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
    hashes[path] = await config.provider.hash({
      value: joined,
      path,
    });
  }
  return Object.keys(hashes).length > 0 ? hashes : undefined;
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

export async function applyTrackingCryptoOnWrite(
  record: TrackingRecord,
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
  const fallback = resolveOpenFallback(config);
  const failMode = resolveFailMode(config);
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

  try {
    const toProtected = await protectScalar(
      config,
      keyContext,
      "to",
      record.to,
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
        ? await protectScalar(config, keyContext, "from", record.from)
        : undefined;

    const metadataMode = resolveFieldMode(
      config,
      "metadata",
      DEFAULT_METADATA_MODE,
    );
    const metadataHashes =
      record.metadata && isObject(record.metadata)
        ? await buildMetadataHashes(config, record.metadata)
        : undefined;

    let metadataEnc: string | undefined;
    if (record.metadata && shouldEncrypt(metadataMode)) {
      const metadataString = JSON.stringify(record.metadata);
      const encrypted = await config.provider.encrypt({
        value: metadataString,
        aad: buildAad(config, keyContext, "metadata"),
        path: "metadata",
      });
      metadataEnc = toCiphertextEnvelopeString(encrypted.ciphertext);
      if (!activeKid && encrypted.kid) {
        activeKid = encrypted.kid;
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
      toHash: await config.provider.hash({
        value: normalizePhoneForHash(record.to),
        path: "to",
      }),
      toMasked,
      fromEnc,
      fromHash:
        fromPlain.length > 0
          ? await config.provider.hash({
              value: normalizePhoneForHash(fromPlain),
              path: "from",
            })
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

  const fallback = resolveOpenFallback(config);
  const failMode = resolveFailMode(config);
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

async function hashFilterValue(
  config: FieldCryptoConfig,
  path: "to" | "from",
  value: string,
): Promise<string> {
  try {
    return await config.provider.hash({
      value: normalizePhoneForHash(value),
      path,
    });
  } catch (error) {
    const failMode = resolveFailMode(config);
    if (failMode === "closed") {
      failOrOpen(config, "hash", path, error);
    }
    return "";
  }
}

export async function normalizeTrackingFilterWithHashes(
  filter: DeliveryTrackingRecordFilter,
  options: DeliveryTrackingFieldCryptoOptions | undefined,
  mode: TrackingCryptoMode,
): Promise<DeliveryTrackingRecordFilter> {
  const config = resolveConfig(options);
  if (!config) return filter;

  const next: DeliveryTrackingRecordFilter = { ...filter };

  if (!next.toHash && next.to) {
    const values = Array.isArray(next.to) ? next.to : [next.to];
    const hashed = await Promise.all(
      values.map((value) => hashFilterValue(config, "to", value)),
    );
    const normalized = hashed.filter((value) => value.length > 0);
    if (normalized.length === 1) next.toHash = normalized[0];
    if (normalized.length > 1) next.toHash = normalized;
    if (mode.secureMode && !mode.compatPlainColumns) {
      next.to = undefined;
    }
  }

  if (!next.fromHash && next.from) {
    const values = Array.isArray(next.from) ? next.from : [next.from];
    const hashed = await Promise.all(
      values.map((value) => hashFilterValue(config, "from", value)),
    );
    const normalized = hashed.filter((value) => value.length > 0);
    if (normalized.length === 1) next.fromHash = normalized[0];
    if (normalized.length > 1) next.fromHash = normalized;
    if (mode.secureMode && !mode.compatPlainColumns) {
      next.from = undefined;
    }
  }

  return next;
}
