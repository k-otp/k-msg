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

export type FieldCryptoMetricName =
  | "crypto_encrypt_ms"
  | "crypto_decrypt_ms"
  | "crypto_fail_count"
  | "key_kid_usage";

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
  return value.replace(/[^\d+]/g, "").trim();
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

export function toCiphertextEnvelopeString(
  ciphertext: string | CryptoEnvelope,
): string {
  return toCiphertextString(ciphertext);
}
