/**
 * Thrown when adding or updating a webhook endpoint would give it the id or
 * URL of an endpoint that is already stored. Stores never replace an
 * endpoint on add; change one with `updateEndpoint()` instead.
 */
export class WebhookEndpointConflictError extends Error {
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
  }
}
