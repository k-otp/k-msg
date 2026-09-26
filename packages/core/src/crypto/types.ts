import { FieldCryptoError } from "./errors";

/**
 * @evidence docs/security/field-crypto-v1.md#field-policy-modes
 *   Enumerates exactly the four field modes the v1 policy defines.
 * @evidenceReview docs/security/field-crypto-v1.md#field-policy-modes #d6936dd
 *   Compared the section's four modes with this union member by member.
 */
export type FieldMode = "plain" | "encrypt" | "encrypt+hash" | "mask";
export type FieldCryptoFailMode = "closed" | "open";
export type FieldCryptoOpenFallback = "masked" | "plaintext" | "null";
export type MaybePromise<T> = T | Promise<T>;

export interface CryptoEnvelope {
  v: number;
  alg: string;
  kid: string;
  iv: string;
  tag: string;
  ct: string;
}

export interface FieldCryptoAad {
  [key: string]: string;
}

export interface FieldCryptoKeyContext {
  tenantId?: string;
  providerId?: string;
  messageId?: string;
  tableName?: string;
  fieldPath?: string;
  requestId?: string;
}

export interface KeySetState {
  activeKid: string;
  decryptKids?: readonly string[];
  refreshedAt?: number;
}

/**
 * @evidence docs/security/field-crypto-v1.md#key-management
 *   Separates the active encrypt kid from the multi-kid decrypt set that
 *   key rotation relies on.
 * @evidenceReview docs/security/field-crypto-v1.md#key-management #e297ee5
 *   Read the three bullets against this interface and the AES-GCM provider's
 *   decrypt, which tries every candidate kid before failing.
 */
export interface KeyResolver {
  resolveEncryptKey(
    context: FieldCryptoKeyContext,
  ): MaybePromise<{ kid: string }>;
  resolveDecryptKeys?(
    context: FieldCryptoKeyContext & {
      ciphertext?: string;
    },
  ): MaybePromise<readonly string[]>;
}

export interface FieldCryptoEncryptInput {
  value: string;
  aad: FieldCryptoAad;
  path: string;
  kid?: string;
}

export interface FieldCryptoDecryptInput {
  ciphertext: string;
  aad: FieldCryptoAad;
  path: string;
  candidateKids?: readonly string[];
}

export interface FieldCryptoHashInput {
  value: string;
  path: string;
  kid?: string;
}

export interface FieldCryptoMaskInput {
  value: string;
  path: string;
}

export interface FieldCryptoProvider {
  encrypt(
    input: FieldCryptoEncryptInput,
  ): MaybePromise<{ ciphertext: string | CryptoEnvelope; kid?: string }>;
  decrypt(input: FieldCryptoDecryptInput): MaybePromise<string>;
  hash(input: FieldCryptoHashInput): MaybePromise<string>;
  mask?(input: FieldCryptoMaskInput): MaybePromise<string>;
}

/**
 * @evidence docs/security/field-crypto-v1.md#scope
 *   The one configuration contract consumed by core, the messaging tracking
 *   stores, and the webhook registry storage.
 * @evidenceReview docs/security/field-crypto-v1.md#scope #3e5d08b
 *   Confirmed the messaging tracking stores and the webhook registry storage
 *   import this type.
 * @evidenceExclude docs/security/field-crypto-v1.md#companion-docs
 *   Links to companion documents and states no implementable requirement.
 * @evidenceExcludeReview docs/security/field-crypto-v1.md#companion-docs #a4cb34b
 *   Checked the section only links the other docs/security guides.
 */
export interface FieldCryptoConfig {
  enabled?: boolean;
  fields: Record<string, FieldMode>;
  failMode?: FieldCryptoFailMode;
  openFallback?: FieldCryptoOpenFallback;
  unsafeAllowPlaintextStorage?: boolean;
  aadFields?: readonly string[];
  keyResolver?: KeyResolver;
  provider: FieldCryptoProvider;
}

/**
 * @evidence docs/security/field-crypto-v1.md#metrics
 *   Names exactly the six metrics the v1 policy lists.
 * @evidenceReview docs/security/field-crypto-v1.md#metrics #db248ba
 *   Compared the section's six metric names with this union one by one.
 */
export type FieldCryptoMetricName =
  | "crypto_encrypt_ms"
  | "crypto_decrypt_ms"
  | "crypto_fail_count"
  | "key_kid_usage"
  | "crypto_circuit_open_count"
  | "crypto_circuit_state";

export type FieldCryptoCircuitState = "closed" | "open" | "half-open";

export interface FieldCryptoControlScope {
  tenantId?: string;
  providerId?: string;
  kid?: string;
}

export interface FieldCryptoControlSignalEvent {
  state: FieldCryptoCircuitState;
  reason: "threshold" | "cooldown" | "manual" | "recovered";
  scope: string;
  scopeParts: FieldCryptoControlScope;
  operation: "encrypt" | "decrypt" | "hash";
  at: number;
  errorClass?: string;
}

export interface FieldCryptoMetricEvent {
  name: FieldCryptoMetricName;
  value?: number;
  kid?: string;
  tags?: Record<string, string | number | boolean | undefined>;
}

function encodeBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const maybeBuffer =
    typeof globalThis !== "undefined"
      ? (
          globalThis as {
            Buffer?: {
              from: (input: Uint8Array) => {
                toString: (encoding: string) => string;
              };
            };
          }
        ).Buffer
      : undefined;
  const base64 = maybeBuffer
    ? maybeBuffer.from(bytes).toString("base64")
    : btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : `${normalized}${"=".repeat(4 - (normalized.length % 4))}`;

  const maybeBuffer =
    typeof globalThis !== "undefined"
      ? (
          globalThis as {
            Buffer?: { from: (input: string, encoding: string) => Uint8Array };
          }
        ).Buffer
      : undefined;

  if (maybeBuffer) {
    return new Uint8Array(maybeBuffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toUint8Array(
  value: string | ArrayBuffer | Uint8Array,
  encoding: "utf8" | "base64url",
): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (encoding === "base64url") return decodeBase64Url(value);
  return new TextEncoder().encode(value);
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toCryptoBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function parseEnvelope(ciphertext: string): CryptoEnvelope {
  const parsed = JSON.parse(ciphertext) as Partial<CryptoEnvelope>;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.v !== "number" ||
    typeof parsed.alg !== "string" ||
    typeof parsed.kid !== "string" ||
    typeof parsed.iv !== "string" ||
    typeof parsed.tag !== "string" ||
    typeof parsed.ct !== "string"
  ) {
    throw new Error("Invalid ciphertext envelope");
  }

  return parsed as CryptoEnvelope;
}

function toCiphertextString(value: string | CryptoEnvelope): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function isCryptoEnvelope(value: unknown): value is CryptoEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CryptoEnvelope>;
  return (
    typeof candidate.v === "number" &&
    typeof candidate.alg === "string" &&
    typeof candidate.kid === "string" &&
    typeof candidate.iv === "string" &&
    typeof candidate.tag === "string" &&
    typeof candidate.ct === "string"
  );
}

export function normalizePhoneForHash(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length === 0) return "";

  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export function createDefaultMasker(
  visibleStart = 3,
  visibleEnd = 2,
): (value: string) => string {
  return (value: string): string => {
    const normalized = String(value ?? "");
    if (normalized.length <= visibleStart + visibleEnd) {
      return "*".repeat(Math.max(0, normalized.length));
    }
    const start = normalized.slice(0, visibleStart);
    const end = normalized.slice(-visibleEnd);
    return `${start}${"*".repeat(normalized.length - visibleStart - visibleEnd)}${end}`;
  };
}

export interface AesGcmFieldCryptoProviderOptions {
  keys: Record<string, string | ArrayBuffer | Uint8Array>;
  activeKid: string;
  hashKeys?: Record<string, string | ArrayBuffer | Uint8Array>;
  keyEncoding?: "utf8" | "base64url";
  hashKeyEncoding?: "utf8" | "base64url";
  algorithm?: "A256GCM";
}

/**
 * @evidence docs/security/field-crypto-v1.md#threat-model
 *   Encrypts with a fresh random IV and the caller's AAD as GCM additional
 *   data, and serves lookups from a separate HMAC instead of deterministic
 *   ciphertext. The plaintext and logging bullets are answered by
 *   fail-policy and logging-policy.
 * @evidenceReview docs/security/field-crypto-v1.md#threat-model #1ba61d5
 *   Read encrypt, decrypt, and hash: a 12-byte getRandomValues IV per call,
 *   AAD passed as additionalData on both paths, and HMAC-SHA-256 for hash.
 *   The messaging stores bind messageId, providerId, tableName, fieldPath, and
 *   tenantId by default; webhook storage, which encrypts one field per table,
 *   binds the table, the endpoint or delivery id, and the tenant when one is
 *   set; reads fall back to the tenant-less AAD for values written before
 *   tenant binding (field-crypto.test.ts in @k-msg/webhook covers both).
 */
export function createAesGcmFieldCryptoProvider(
  options: AesGcmFieldCryptoProviderOptions,
): FieldCryptoProvider {
  const algorithm = options.algorithm ?? "A256GCM";
  const keyEncoding = options.keyEncoding ?? "base64url";
  const hashKeyEncoding = options.hashKeyEncoding ?? keyEncoding;
  const aesKeyCache = new Map<string, Promise<CryptoKey>>();
  const hashKeyCache = new Map<string, Promise<CryptoKey>>();

  const importAesKey = (kid: string): Promise<CryptoKey> => {
    const cached = aesKeyCache.get(kid);
    if (cached) return cached;

    const raw = options.keys[kid];
    if (!raw) {
      throw new Error(`Unknown encryption key id: ${kid}`);
    }
    const bytes = toUint8Array(raw, keyEncoding);
    const promise = crypto.subtle.importKey(
      "raw",
      toCryptoBufferSource(bytes),
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );
    aesKeyCache.set(kid, promise);
    return promise;
  };

  const importHashKey = (kid: string): Promise<CryptoKey> => {
    const cached = hashKeyCache.get(kid);
    if (cached) return cached;

    const raw = options.hashKeys?.[kid] ?? options.keys[kid];
    if (!raw) {
      throw new Error(`Unknown hash key id: ${kid}`);
    }
    const bytes = toUint8Array(raw, hashKeyEncoding);
    const promise = crypto.subtle.importKey(
      "raw",
      toCryptoBufferSource(bytes),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    hashKeyCache.set(kid, promise);
    return promise;
  };

  return {
    async encrypt(input) {
      const kid = input.kid ?? options.activeKid;
      const key = await importAesKey(kid);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const additionalData = new TextEncoder().encode(
        JSON.stringify(input.aad ?? {}),
      );
      const plaintext = new TextEncoder().encode(input.value);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: toCryptoBufferSource(iv),
          additionalData: toCryptoBufferSource(additionalData),
          tagLength: 128,
        },
        key,
        toCryptoBufferSource(plaintext),
      );

      const encryptedBytes = new Uint8Array(encrypted);
      const tag = encryptedBytes.slice(encryptedBytes.length - 16);
      const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);

      return {
        ciphertext: {
          v: 1,
          alg: algorithm,
          kid,
          iv: encodeBase64Url(iv),
          tag: encodeBase64Url(tag),
          ct: encodeBase64Url(ciphertext),
        },
        kid,
      };
    },

    async decrypt(input) {
      const envelope = parseEnvelope(input.ciphertext);
      const candidateKids =
        input.candidateKids && input.candidateKids.length > 0
          ? input.candidateKids
          : [envelope.kid];
      const iv = decodeBase64Url(envelope.iv);
      const tag = decodeBase64Url(envelope.tag);
      const ciphertext = decodeBase64Url(envelope.ct);

      const encrypted = new Uint8Array(ciphertext.length + tag.length);
      encrypted.set(ciphertext, 0);
      encrypted.set(tag, ciphertext.length);

      const additionalData = new TextEncoder().encode(
        JSON.stringify(input.aad ?? {}),
      );

      let lastError: unknown;
      for (const kid of candidateKids) {
        try {
          const key = await importAesKey(kid);
          const decrypted = await crypto.subtle.decrypt(
            {
              name: "AES-GCM",
              iv: toCryptoBufferSource(iv),
              additionalData: toCryptoBufferSource(additionalData),
              tagLength: 128,
            },
            key,
            toCryptoBufferSource(encrypted),
          );
          return new TextDecoder().decode(new Uint8Array(decrypted));
        } catch (error) {
          lastError = error;
        }
      }

      throw new Error(
        `Failed to decrypt ciphertext: ${lastError instanceof Error ? lastError.message : String(lastError ?? "unknown")}`,
      );
    },

    async hash(input) {
      const kid = input.kid ?? options.activeKid;
      const key = await importHashKey(kid);
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        toCryptoBufferSource(new TextEncoder().encode(input.value)),
      );
      return toHex(signature);
    },

    mask(input) {
      return createDefaultMasker()(input.value);
    },
  };
}

export function createNoopFieldCryptoProvider(): FieldCryptoProvider {
  return {
    encrypt(input) {
      return {
        ciphertext: JSON.stringify({
          v: 1,
          alg: "NOOP",
          kid: "noop",
          iv: "",
          tag: "",
          ct: input.value,
        } satisfies CryptoEnvelope),
      };
    },
    decrypt(input) {
      try {
        const parsed = parseEnvelope(input.ciphertext);
        return parsed.ct;
      } catch {
        return input.ciphertext;
      }
    },
    hash(input) {
      const normalized = normalizePhoneForHash(input.value);
      return encodeBase64Url(new TextEncoder().encode(normalized));
    },
    mask(input) {
      return createDefaultMasker()(input.value);
    },
  };
}

/**
 * Throws unless `value` is a v1 envelope: `v` 1, `alg` "A256GCM", and string
 * `kid`, `iv`, `tag`, and `ct`.
 *
 * @evidence docs/security/field-crypto-v1.md#envelope-format
 *   Rejects any envelope object but v1 A256GCM before
 *   toCiphertextEnvelopeString persists it; the AES-GCM provider emits
 *   exactly this shape, and string ciphertext stays the provider's own.
 * @evidenceReview docs/security/field-crypto-v1.md#envelope-format #5d88509
 *   Compared the section's keys and constants with this check and the
 *   AES-GCM provider's encrypt output, and ran envelope.test.ts, which
 *   rejects v 2, A128GCM, and a missing ct and keeps string ciphertext.
 */
export function assertCryptoEnvelopeV1(
  value: unknown,
): asserts value is CryptoEnvelope {
  const shapeValid = isCryptoEnvelope(value);
  if (shapeValid && value.v === 1 && value.alg === "A256GCM") {
    return;
  }
  const candidate =
    value && typeof value === "object"
      ? (value as Partial<CryptoEnvelope>)
      : {};
  throw new FieldCryptoError(
    "policy",
    "ciphertext envelope must be v1 A256GCM with string kid, iv, tag, and ct",
    {
      rule: "fieldCrypto.envelope.v1",
      // Distinguishes a malformed envelope from a wrong version or algorithm.
      shapeValid,
      v: candidate.v,
      alg: candidate.alg,
    },
  );
}

/**
 * Serializes provider ciphertext for storage. An envelope object must be a v1
 * envelope; a string is the provider's own serialized form and is kept as is.
 */
export function toCiphertextEnvelopeString(
  ciphertext: string | CryptoEnvelope,
): string {
  if (typeof ciphertext !== "string") assertCryptoEnvelopeV1(ciphertext);
  return toCiphertextString(ciphertext);
}
