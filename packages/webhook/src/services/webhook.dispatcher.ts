import type {
  WebhookAttempt,
  WebhookConfig,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEvent,
} from "../types/webhook.types";

export interface HttpClient {
  fetch(url: string, options: RequestInit): Promise<Response>;
}

export class DefaultHttpClient implements HttpClient {
  async fetch(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, options);
  }
}

export class MockHttpClient implements HttpClient {
  private responses: Map<string, Response> = new Map();

  setMockResponse(url: string, response: Response): void {
    this.responses.set(url, response);
  }

  async fetch(url: string, options: RequestInit): Promise<Response> {
    // For test URLs, return mock responses
    if (url.includes("webhook.example.com") || url.includes("test-")) {
      // Add small delay to simulate network latency
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 10 + 5),
      );

      const mockResponse = this.responses.get(url);
      if (mockResponse) {
        return mockResponse;
      }

      // Default success response for test URLs
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
      });
    }

    // For non-test URLs, use real fetch
    return fetch(url, options);
  }
}

export class WebhookDispatcher {
  private config: WebhookConfig;
  private httpClient: HttpClient;

  constructor(config: WebhookConfig, httpClient?: HttpClient) {
    this.config = config;
    this.httpClient = httpClient || new DefaultHttpClient();
  }

  async dispatch(
    event: WebhookEvent,
    endpoint: WebhookEndpoint,
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: this.generateDeliveryId(),
      endpointId: endpoint.id,
      eventId: event.id,
      url: endpoint.url,
      httpMethod: "POST",
      headers: this.buildHeaders(endpoint, event),
      payload: JSON.stringify(event),
      attempts: [],
      status: "pending",
      createdAt: new Date(),
    };

    await this.executeDelivery(delivery, endpoint);
    return delivery;
  }

  private async executeDelivery(
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint,
  ): Promise<void> {
    const maxRetries =
      endpoint.retryConfig?.maxRetries || this.config.maxRetries;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const attemptResult = await this.makeHttpRequest(
        delivery,
        endpoint,
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

      if (attempt <= maxRetries) {
        const delay = this.calculateRetryDelay(attempt, endpoint);
        await this.sleep(delay);
      }
    }

    delivery.status = "exhausted";
    delivery.completedAt = new Date();
  }

  private async makeHttpRequest(
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint,
    attemptNumber: number,
  ): Promise<WebhookAttempt> {
    const startTime = Date.now();
    const attempt: WebhookAttempt = {
      attemptNumber,
      timestamp: new Date(),
      latencyMs: 0,
    };

    try {
      const response = await this.httpClient.fetch(delivery.url, {
        method: delivery.httpMethod,
        headers: delivery.headers,
        body: delivery.payload,
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
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-ID": event.id,
      "X-Webhook-Event": event.type,
      "X-Webhook-Timestamp": event.timestamp.toISOString(),
      "User-Agent": "K-Message-Webhook/1.0",
    };

    // 엔드포인트별 커스텀 헤더
    if (endpoint.headers) {
      Object.assign(headers, endpoint.headers);
    }

    // 보안 서명
    if (endpoint.secret) {
      const signature = this.generateSignature(
        JSON.stringify(event),
        endpoint.secret,
      );
      headers["X-Webhook-Signature"] = signature;
    }

    return headers;
  }

  private generateSignature(payload: string, secret: string): string {
    // 실제 구현에서는 crypto 모듈 사용
    return `sha256=${Buffer.from(payload + secret).toString("base64")}`;
  }

  private calculateRetryDelay(
    attempt: number,
    endpoint: WebhookEndpoint,
  ): number {
    const baseDelay =
      endpoint.retryConfig?.retryDelayMs || this.config.retryDelayMs;
    const multiplier = endpoint.retryConfig?.backoffMultiplier || 2;
    return baseDelay * multiplier ** (attempt - 1);
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
