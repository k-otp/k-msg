import { RetryManager } from "../retry/retry.manager";
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

export class DefaultHttpClient implements HttpClient {
  async fetch(url: string, _options: RequestInit): Promise<Response> {
    return fetch(url, _options);
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
  private httpClient: HttpClient;
  private securityManager: SecurityManager;
  private retryManager: RetryManager;

  constructor(config: WebhookConfig, httpClient?: HttpClient) {
    this.config = config;
    this.httpClient = httpClient || new DefaultHttpClient();
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

    const secret = this.config.enableSecurity
      ? resolveSigningSecret(endpoint, this.config)
      : undefined;
    if (this.config.enableSecurity && secret === undefined) {
      // Receivers expect a signature when security is on, so never send
      // without one.
      const now = new Date();
      delivery.attempts.push({
        attemptNumber: 1,
        timestamp: now,
        latencyMs: 0,
        error: `Not sent: enableSecurity is on, but endpoint ${endpoint.id} has no signing secret and delivery.secretKey is not set`,
      });
      delivery.status = "failed";
      delivery.completedAt = now;
      return delivery;
    }

    await this.executeDelivery(delivery, endpoint, event, secret);
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
      attempt.responseBody = await response.text();
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
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-ID": event.id,
      "X-Webhook-Event": event.type,
      [WEBHOOK_TIMESTAMP_HEADER]: timestampSeconds,
      "User-Agent": "K-Message-Webhook/1.0",
    };

    // 엔드포인트별 커스텀 헤더
    if (endpoint.headers) {
      Object.assign(headers, endpoint.headers);
    }

    // Security (HMAC signature)
    if (secret !== undefined) {
      const signature = this.securityManager.generateSignatureWithTimestamp(
        payload,
        timestampSeconds,
        secret,
      );
      const signatureHeader = this.securityManager.getConfig().header;
      headers[signatureHeader] = signature;
    }

    return headers;
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
