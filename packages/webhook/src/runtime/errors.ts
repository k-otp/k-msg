// The build bundles each entry point on its own, so the root and
// @k-msg/webhook/adapters/cloudflare each carry a copy of the class below.
// instanceof checks this registered symbol, which every copy shares, rather
// than the prototype chain.
const CONFLICT_ERROR_BRAND = Symbol.for(
  "@k-msg/webhook/WebhookEndpointConflictError",
);

/**
 * Thrown when adding or updating a webhook endpoint would give it the id or
 * URL of an endpoint that is already stored. Stores never replace an
 * endpoint on add; change one with `updateEndpoint()` instead.
 *
 * `instanceof` works whichever entry point threw it, for example the D1
 * store from `@k-msg/webhook/adapters/cloudflare`.
 */
export class WebhookEndpointConflictError extends Error {
  /** True for a conflict error from any copy of this class. */
  static [Symbol.hasInstance](value: unknown): boolean {
    if (this !== WebhookEndpointConflictError) {
      // A subclass keeps the ordinary prototype check.
      return Function.prototype[Symbol.hasInstance].call(this, value);
    }
    return (
      typeof value === "object" &&
      value !== null &&
      (value as { [CONFLICT_ERROR_BRAND]?: unknown })[CONFLICT_ERROR_BRAND] ===
        true
    );
  }

  /** Which value is already taken. */
  readonly field: "id" | "url";
  /**
   * The taken id or URL. It is not enumerable, so loggers that print an
   * error's properties do not print a URL that may carry a token.
   */
  declare readonly value: string;
  /** The id of the stored endpoint that has it. */
  readonly endpointId: string;

  constructor(field: "id" | "url", value: string, endpointId: string) {
    // The URL stays out of the message, which reaches logs, because it may
    // carry a token; `value` holds it.
    super(
      field === "url"
        ? `This webhook endpoint URL is already registered as ${endpointId}`
        : `Webhook endpoint ${value} already exists`,
    );
    this.name = "WebhookEndpointConflictError";
    this.field = field;
    Object.defineProperty(this, "value", { value, enumerable: false });
    this.endpointId = endpointId;
    Object.defineProperty(this, CONFLICT_ERROR_BRAND, { value: true });
  }
}

/**
 * Thrown when an endpoint URL names a host that the default HTTP client would
 * refuse to deliver to, because `delivery.allowedHosts` does not list it. The
 * runtime checks this when an endpoint is added or its URL changes, so the
 * endpoint is not stored and then fails every delivery.
 *
 * It is not thrown when an `httpClient` is injected: that client decides which
 * destinations it trusts.
 */
export class WebhookHostNotAllowedError extends Error {
  /** The URL's hostname, which is not a secret (the rest of the URL may be). */
  readonly host: string;

  constructor(host: string) {
    super(
      `Webhook host ${host} is not explicitly trusted; add it to delivery.allowedHosts, or inject a DNS-pinned HTTP client`,
    );
    this.name = "WebhookHostNotAllowedError";
    this.host = host;
  }
}
