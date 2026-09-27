import type { WebhookEndpoint } from "../types/webhook.types";

// An endpoint read while field crypto, failing open, could not decrypt its
// stored secret carries `secretUndecryptable: true` instead of the secret. It
// is a plain field, so it survives JSON, structured clones, and schema
// parsing on the way to a dispatcher.

/** A copy of the endpoint without its secret, flagged as having one. */
export function markSecretUndecryptable(
  endpoint: WebhookEndpoint,
): WebhookEndpoint {
  const marked: WebhookEndpoint = { ...endpoint, secretUndecryptable: true };
  delete marked.secret;
  return marked;
}

/**
 * Whether the endpoint has a stored secret that could not be decrypted.
 * Nothing may be signed for it with another secret, and writing it back keeps
 * the stored one. Setting `secret`, even to `undefined`, overrides the flag,
 * which a spread of the endpoint read carries along.
 */
export function hasUndecryptableSecret(
  endpoint: Pick<WebhookEndpoint, "secret" | "secretUndecryptable">,
): boolean {
  return (
    endpoint.secretUndecryptable === true && !Object.hasOwn(endpoint, "secret")
  );
}

/** The value without the flag, which describes a read, not a stored record. */
export function unmarkSecret<T extends { secretUndecryptable?: true }>(
  value: T,
): T {
  if (!Object.hasOwn(value, "secretUndecryptable")) return value;
  const unmarked = { ...value };
  delete unmarked.secretUndecryptable;
  return unmarked;
}
