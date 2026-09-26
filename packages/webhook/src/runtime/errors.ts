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
  /** The taken id or URL. */
  readonly value: string;
  /** The id of the stored endpoint that has it. */
  readonly endpointId: string;

  constructor(field: "id" | "url", value: string, endpointId: string) {
    super(
      field === "url"
        ? `Webhook endpoint URL ${value} is already registered as ${endpointId}`
        : `Webhook endpoint ${value} already exists`,
    );
    this.name = "WebhookEndpointConflictError";
    this.field = field;
    this.value = value;
    this.endpointId = endpointId;
    Object.defineProperty(this, CONFLICT_ERROR_BRAND, { value: true });
  }
}
