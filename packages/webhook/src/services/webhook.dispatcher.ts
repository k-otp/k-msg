import { hasUndecryptableSecret } from "../crypto/undecryptable-secret";
import { RetryManager } from "../retry/retry.manager";
import { validateEndpointUrl } from "../runtime/endpoint-validation";
import {
  SecurityManager,
  WEBHOOK_TIMESTAMP_HEADER,
} from "../security/security.manager";
import type {
  WebhookAttempt,
  WebhookConfig,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEvent,
} from "../types/webhook.types";

/**
 * The secret that signs deliveries to an endpoint: its own, or else the
 * shared `secretKey`. An empty string counts as no secret.
 */
export function resolveSigningSecret(
  endpoint: Pick<WebhookEndpoint, "secret">,
  config: Pick<WebhookConfig, "secretKey">,
): string | undefined {
  if (typeof endpoint.secret === "string" && endpoint.secret.length > 0) {
    return endpoint.secret;
  }
  if (typeof config.secretKey === "string" && config.secretKey.length > 0) {
    return config.secretKey;
  }
  return undefined;
}

export interface HttpClient {
  fetch(url: string, options: RequestInit): Promise<Response>;
}

/** Keep a bounded diagnostic prefix and cancel the rest, even for chunked responses. */
async function readResponsePrefix(response: Response, limit: number) {
  if (!response.body) return { text: "", truncated: false };
  if (limit === 0) {
    void response.body.cancel().catch(() => undefined);
    return { text: "", truncated: true };
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let truncated = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const take = Math.min(value.byteLength, limit - length);
      if (take > 0) {
        chunks.push(value.slice(0, take));
        length += take;
      }
      if (take < value.byteLength || length === limit) {
        truncated = true;
        void reader.cancel().catch(() => undefined);
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { text: new TextDecoder().decode(bytes), truncated };
}

export class DefaultHttpClient implements HttpClient {
  private readonly hosts: ReadonlySet<string>;
  constructor(allowedHosts: readonly string[] = []) {
    this.hosts = new Set(
      allowedHosts.map((host) => {
        const normalized = host.toLowerCase().replace(/\.$/, "");
        const parsed = new URL(`https://${normalized}`);
        if (
          parsed.hostname !== normalized ||
          parsed.port ||
          parsed.username ||
          parsed.password ||
          parsed.pathname !== "/" ||
          parsed.search ||
          parsed.hash
        ) {
          throw new TypeError(
            "allowedHosts must contain exact DNS hostnames, without URLs, ports or wildcards",
          );
        }
        if (normalized.includes("*"))
          throw new TypeError("Wildcard hosts are not allowed");
        return normalized;
      }),
    );
  }
  async fetch(url: string, _options: RequestInit): Promise<Response> {
    const parsed = validateEndpointUrl(url);
    if (parsed.username || parsed.password)
      throw new Error("Webhook URL credentials are not allowed");
    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    if (!this.hosts.has(host)) {
      throw new Error(
        "Webhook host is not explicitly trusted; configure allowedHosts or a DNS-pinned HTTP client",
      );
    }
    return fetch(parsed, { ..._options, redirect: "manual" });
  }
}

export class MockHttpClient implements HttpClient {
  private responses: Map<string, Response> = new Map();
  private defaultResponse: Response = new Response(
    JSON.stringify({ status: "ok" }),
    {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
    },
  );

  setMockResponse(url: string, response: Response): void {
    this.responses.set(url, response);
  }

  setDefaultResponse(response: Response): void {
    this.defaultResponse = response;
  }

  async fetch(url: string, _options: RequestInit): Promise<Response> {
    // Keep mock client fully deterministic and side-effect free.
    const mockResponse = this.responses.get(url);
    if (mockResponse) {
      return mockResponse;
    }

    // Do not make real network calls from the mock client.
    return this.defaultResponse;
  }
}

export class WebhookDispatcher {
  private config: WebhookConfig;
  private readonly maxResponseBodyBytes: number;
  private httpClient: HttpClient;
  private securityManager: SecurityManager;
  private retryManager: RetryManager;

  constructor(config: WebhookConfig, httpClient?: HttpClient) {
    this.config = config;
    this.httpClient = httpClient || new DefaultHttpClient(config.allowedHosts);
    const limit = config.maxResponseBodyBytes ?? 4096;
    if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1_048_576) {
      throw new RangeError(
        "maxResponseBodyBytes must be an integer between 0 and 1048576",
      );
    }
    this.maxResponseBodyBytes = limit;
    this.securityManager = new SecurityManager(config);
    this.retryManager = new RetryManager(config);
  }

  async dispatch(
    event: WebhookEvent,
    endpoint: WebhookEndpoint,
  ): Promise<WebhookDelivery> {
    const payload = JSON.stringify(event);

    const delivery: WebhookDelivery = {
      id: this.generateDeliveryId(),
      endpointId: endpoint.id,
      eventId: event.id,
      eventType: event.type,
      url: endpoint.url,
      httpMethod: "POST",
      // Each attempt replaces these with the headers it sent.
      headers: {},
      payload,
      attempts: [],
      status: "pending",
      createdAt: new Date(),
    };

    // The endpoint's receiver checks its own secret, so a secret field crypto
    // could not decrypt is not replaced with secretKey either.
    if (this.config.enableSecurity && hasUndecryptableSecret(endpoint)) {
      return this.notSent(
        delivery,
        `Not sent: enableSecurity is on, but the secret of endpoint ${endpoint.id} could not be decrypted`,
      );
    }
    const secret = this.config.enableSecurity
      ? resolveSigningSecret(endpoint, this.config)
      : undefined;
    if (this.config.enableSecurity && secret === undefined) {
      // Receivers expect a signature when security is on, so never send
      // without one.
      return this.notSent(
        delivery,
        `Not sent: enableSecurity is on, but endpoint ${endpoint.id} has no signing secret and delivery.secretKey is not set`,
      );
    }

    await this.executeDelivery(delivery, endpoint, event, secret);
    return delivery;
  }

  // Fails the delivery without a request; its only attempt says why.
  private notSent(delivery: WebhookDelivery, error: string): WebhookDelivery {
    const now = new Date();
    delivery.attempts.push({
      attemptNumber: 1,
      timestamp: now,
      latencyMs: 0,
      error,
    });
    delivery.status = "failed";
    delivery.completedAt = now;
    return delivery;
  }

  private async executeDelivery(
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    secret: string | undefined,
  ): Promise<void> {
    const maxRetries =
      endpoint.retryConfig?.maxRetries ?? this.config.maxRetries;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const attemptResult = await this.makeHttpRequest(
        delivery,
        endpoint,
        event,
        secret,
        attempt,
      );
      delivery.attempts.push(attemptResult);

      if (
        attemptResult.httpStatus &&
        attemptResult.httpStatus >= 200 &&
        attemptResult.httpStatus < 300
      ) {
        delivery.status = "success";
        delivery.completedAt = new Date();
        return;
      }

      const canRetry =
        attempt <= maxRetries && this.shouldRetryAttempt(attemptResult);

      if (!canRetry) {
        delivery.status = "failed";
        delivery.completedAt = new Date();
        return;
      }

      const delay = this.calculateRetryDelay(attempt, endpoint);
      delivery.nextRetryAt = new Date(Date.now() + delay);
      await this.sleep(delay);
    }

    delivery.status = "exhausted";
    delivery.completedAt = new Date();
  }

  // The delivery loop enforces the effective (per-endpoint) retry budget; this
  // only decides whether the failure is worth retrying.
  private shouldRetryAttempt(attempt: WebhookAttempt): boolean {
    // If we got an HTTP response code, decide based on status.
    if (typeof attempt.httpStatus === "number") {
      return this.retryManager.shouldRetryStatus(attempt.httpStatus);
    }

    // Otherwise decide based on error message (network/timeouts etc).
    if (attempt.error) {
      return this.retryManager.isRetryableError(new Error(attempt.error));
    }

    return true;
  }

  private async makeHttpRequest(
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    secret: string | undefined,
    attemptNumber: number,
  ): Promise<WebhookAttempt> {
    const startTime = Date.now();
    const attempt: WebhookAttempt = {
      attemptNumber,
      timestamp: new Date(startTime),
      latencyMs: 0,
    };

    // Signed with the time this attempt is sent, not the event's time, so a
    // retry or a late event still passes the receiver's freshness check.
    const headers = this.buildHeaders(
      endpoint,
      event,
      delivery.payload,
      Math.floor(startTime / 1000).toString(),
      secret,
    );
    delivery.headers = headers;

    try {
      const response = await this.httpClient.fetch(delivery.url, {
        method: delivery.httpMethod,
        headers,
        body: delivery.payload,
        // A redirect could lead to a host endpoint validation would reject.
        redirect: "manual",
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      attempt.httpStatus = response.status;
      const captured = await readResponsePrefix(
        response,
        this.maxResponseBodyBytes,
      );
      attempt.responseBody = captured.text;
      attempt.responseBodyTruncated = captured.truncated;
      // Headers를 객체로 변환
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      attempt.responseHeaders = responseHeaders;
      attempt.latencyMs = Date.now() - startTime;

      if (!response.ok) {
        attempt.error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      attempt.latencyMs = Date.now() - startTime;
      attempt.error = error instanceof Error ? error.message : "Unknown error";
    }

    return attempt;
  }

  private buildHeaders(
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    payload: string,
    timestampSeconds: string,
    secret: string | undefined,
  ): Record<string, string> {
    // Header names are case-insensitive, so each is keyed in lower case and a
    // later value replaces every spelling of the same name.
    const headers = new Map<string, [name: string, value: string]>();
    const set = (name: string, value: string): void => {
      headers.set(name.toLowerCase(), [name, value]);
    };

    set("Content-Type", "application/json");
    set("User-Agent", "K-Message-Webhook/1.0");

    // 엔드포인트별 커스텀 헤더
    for (const [name, value] of Object.entries(endpoint.headers ?? {})) {
      set(name, value);
    }

    // Set last, so an endpoint's headers cannot replace what the signature
    // covers or what receivers route on.
    set("X-Webhook-ID", event.id);
    set("X-Webhook-Event", event.type);
    set(WEBHOOK_TIMESTAMP_HEADER, timestampSeconds);

    // Security (HMAC signature)
    if (secret !== undefined) {
      const signature = this.securityManager.generateSignatureWithTimestamp(
        payload,
        timestampSeconds,
        secret,
      );
      set(this.securityManager.getConfig().header, signature);
    }

    return Object.fromEntries(headers.values());
  }

  private calculateRetryDelay(
    attempt: number,
    endpoint: WebhookEndpoint,
  ): number {
    const baseDelay =
      endpoint.retryConfig?.retryDelayMs || this.config.retryDelayMs;
    const multiplier =
      endpoint.retryConfig?.backoffMultiplier ||
      this.config.backoffMultiplier ||
      2;

    // `attempt` is 1-based and represents the retry number (after the initial attempt).
    let delay = baseDelay * multiplier ** attempt;

    if (typeof this.config.maxDelayMs === "number") {
      delay = Math.min(delay, this.config.maxDelayMs);
    }

    if (this.config.jitter !== false) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.max(0, Math.floor(delay));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateDeliveryId(): string {
    return `delivery_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  async shutdown(): Promise<void> {
    // 진행 중인 요청 정리
  }
}
