import {
  type FieldCryptoConfig,
  type FieldCryptoKeyContext,
  isCryptoEnvelope,
} from "./types";

/** Keeps the non-empty string kids of a resolver answer, trimmed. */
export function normalizeKidList(kids: unknown): string[] {
  return (Array.isArray(kids) ? kids : [])
    .filter((kid): kid is string => typeof kid === "string")
    .map((kid) => kid.trim())
    .filter((kid) => kid.length > 0);
}

/**
 * Reads the `kid` of a v1 ciphertext envelope, exactly as written. Returns
 * `undefined` for any other value, including a provider's own JSON format.
 */
export function extractEnvelopeKid(ciphertext: unknown): string | undefined {
  if (typeof ciphertext !== "string" || ciphertext[0] !== "{") {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(ciphertext);
    // The same v1 contract assertCryptoEnvelopeV1 enforces: any other JSON is
    // the provider's own format, and its fields are not ours to read.
    if (
      !isCryptoEnvelope(parsed) ||
      parsed.v !== 1 ||
      parsed.alg !== "A256GCM"
    ) {
      return undefined;
    }
    return parsed.kid.length > 0 ? parsed.kid : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The `kid` a field is encrypted under: the one `resolveEncryptKey` returns,
 * or `undefined` for the provider's default key when there is no resolver or
 * it returns a blank `kid`.
 */
export async function resolveFieldEncryptKid(
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

/**
 * The `candidateKids` to decrypt a field with: the envelope's own `kid` first,
 * then every `kid` from `resolveDecryptKeys`. `undefined` lets the provider
 * pick the key from the envelope.
 *
 * @evidence docs/security/field-crypto-v1.md#key-management
 *   The one decrypt key selection shared by the tracking and webhook stores.
 * @evidenceReview docs/security/field-crypto-v1.md#key-management #b219abe
 *   Read the decrypt rule: the envelope kid leads, resolveDecryptKeys follows
 *   without duplicates, and both stores call this. Ran key-selection.test.ts
 *   and the webhook test that decrypts after the resolver drops the kid.
 */
export async function resolveFieldDecryptKids(
  config: FieldCryptoConfig,
  context: FieldCryptoKeyContext & { ciphertext?: string },
): Promise<readonly string[] | undefined> {
  const envelopeKid = extractEnvelopeKid(context.ciphertext);
  if (!config.keyResolver?.resolveDecryptKeys) {
    return envelopeKid ? [envelopeKid] : undefined;
  }

  const resolved = await config.keyResolver.resolveDecryptKeys(context);
  const kids = normalizeKidList(resolved).filter((kid) => kid !== envelopeKid);
  if (envelopeKid) kids.unshift(envelopeKid);

  return kids.length > 0 ? kids : undefined;
}
