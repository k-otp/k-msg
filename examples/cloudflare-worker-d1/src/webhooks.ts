import {
  resolveEndpointValidationOptions,
  SecurityManager,
  validateEndpointUrl,
  type WebhookConfig,
  WebhookEventType,
  type WebhookRuntimeSecurityOptions,
  WebhookRuntimeService,
} from "@k-msg/webhook";
import { createD1WebhookPersistence } from "@k-msg/webhook/adapters/cloudflare";
import type { Config } from "./env";

/** The events this Worker sends; endpoints subscribe to all of them by default. */
export const MESSAGE_EVENT_TYPES: readonly WebhookEventType[] = [
  WebhookEventType.MESSAGE_SENT,
  WebhookEventType.MESSAGE_DELIVERED,
  WebhookEventType.MESSAGE_FAILED,
];

export const SIGNATURE_HEADER = "X-Webhook-Signature";
// Set by the dispatcher on every request; the signature covers it.
export const TIMESTAMP_HEADER = "X-Webhook-Timestamp";
export const EVENT_ID_HEADER = "X-Webhook-ID";
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

const deliveryConfig: WebhookConfig = {
  enabledEvents: [...MESSAGE_EVENT_TYPES],
  // Sign each request with its endpoint's secret:
  // sha256=HMAC-SHA256(secret, `${timestamp}.${body}`).
  enableSecurity: true,
  algorithm: "sha256",
  signatureHeader: SIGNATURE_HEADER,
  signaturePrefix: "sha256=",
  // Deliveries run inside the cron invocation, so the retry budget is small.
  timeoutMs: 5_000,
  maxRetries: 2,
  retryDelayMs: 1_000,
  maxDelayMs: 4_000,
  // Required by WebhookConfig; they only affect emit()'s queue, which this
  // Worker does not use.
  batchSize: 20,
  batchTimeoutMs: 1_000,
};

function endpointSecurity(config: Config): WebhookRuntimeSecurityOptions {
  return {
    allowPrivateHosts: config.allowPrivateWebhookUrls,
    allowHttpForLocalhost: config.allowPrivateWebhookUrls,
  };
}

/** A webhook runtime for one request or cron run. */
export function createWebhookRuntime(config: Config): WebhookRuntimeService {
  return new WebhookRuntimeService({
    delivery: deliveryConfig,
    // migrations/ owns the tables, so skip the CREATE TABLE statements the
    // persistence would otherwise run on first use.
    persistence: createD1WebhookPersistence(config.db, {
      initializeSchema: false,
    }),
    security: endpointSecurity(config),
    // No setInterval in a Worker: events go out through emitSync within the
    // request or cron run that produced them.
    autoStart: false,
  });
}

/**
 * Applies the same URL rules as WebhookRuntimeService.addEndpoint: HTTPS and
 * a public host, unless DEV_ALLOW_PRIVATE_WEBHOOK_URLS is set. Returns the
 * normalized URL, or throws an Error whose message is safe to show.
 */
export function normalizeEndpointUrl(config: Config, url: string): string {
  const options = resolveEndpointValidationOptions(endpointSecurity(config));
  return validateEndpointUrl(url, options).href;
}

export function generateEndpointSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `whsec_${hex.join("")}`;
}

// Stateless apart from its configuration, so one instance serves every request.
const signatures = new SecurityManager(deliveryConfig);

export type WebhookVerification =
  | { ok: true }
  | {
      ok: false;
      code: "MISSING_SIGNATURE" | "INVALID_SIGNATURE" | "STALE_WEBHOOK";
      message: string;
    };

/**
 * What a receiver checks before trusting a webhook: the signature over the
 * raw body and timestamp, then the timestamp's age, which stops a captured
 * request from being replayed later.
 */
export function verifyWebhook(request: {
  body: string;
  signature: string | undefined;
  timestamp: string | undefined;
  secret: string;
}): WebhookVerification {
  if (!request.signature || !request.timestamp) {
    return {
      ok: false,
      code: "MISSING_SIGNATURE",
      message: `${SIGNATURE_HEADER} and ${TIMESTAMP_HEADER} are required`,
    };
  }
  const signed = signatures.verifySignatureWithTimestamp(
    request.body,
    request.timestamp,
    request.signature,
    request.secret,
  );
  if (!signed) {
    return {
      ok: false,
      code: "INVALID_SIGNATURE",
      message: "The signature does not match the body and timestamp",
    };
  }
  if (!signatures.verifyTimestamp(request.timestamp, MAX_WEBHOOK_AGE_SECONDS)) {
    return {
      ok: false,
      code: "STALE_WEBHOOK",
      message: `${TIMESTAMP_HEADER} is more than 5 minutes from the current time`,
    };
  }
  return { ok: true };
}
