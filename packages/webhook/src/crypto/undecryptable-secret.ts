import type { WebhookEndpoint } from "../types/webhook.types";

// Marks an endpoint read without its secret because field crypto failed open
// and could not decrypt the stored one. The mark is an enumerable symbol, so it
// survives `{ ...endpoint }` while JSON and the SQL stores never persist it,
// and a registered one, so the separately bundled entry points share it.
const UNDECRYPTABLE_SECRET: unique symbol = Symbol.for(
  "@k-msg/webhook.undecryptableSecret",
);

type MarkedEndpoint = WebhookEndpoint & { [UNDECRYPTABLE_SECRET]?: true };

/** A copy of the endpoint without its secret, marked as having one. */
export function markSecretUndecryptable(
  endpoint: WebhookEndpoint,
): WebhookEndpoint {
  const marked: MarkedEndpoint = { ...endpoint, [UNDECRYPTABLE_SECRET]: true };
  delete marked.secret;
  return marked;
}

/**
 * Whether the endpoint has a stored secret that could not be decrypted.
 * Nothing may be signed for it with another secret, and writing it back keeps
 * the stored one. Setting `secret`, even to `undefined`, overrides the mark,
 * which a spread of the endpoint read carries along.
 */
export function hasUndecryptableSecret(
  endpoint: Pick<WebhookEndpoint, "secret">,
): boolean {
  return (
    (endpoint as Partial<MarkedEndpoint>)[UNDECRYPTABLE_SECRET] === true &&
    !Object.hasOwn(endpoint, "secret")
  );
}

/** The value without the mark, which describes a read, not a stored record. */
export function unmarkSecret<T extends object>(value: T): T {
  if (!(UNDECRYPTABLE_SECRET in value)) return value;
  const unmarked = { ...value } as T & Partial<MarkedEndpoint>;
  delete unmarked[UNDECRYPTABLE_SECRET];
  return unmarked;
}
