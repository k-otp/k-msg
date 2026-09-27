/**
 * Webhook Collector
 * 웹훅을 통한 외부 이벤트 수집
 */

import { EventEmitter } from "../shared/event-emitter";
import type { EventData } from "./event.collector";

export interface WebhookData {
  id: string;
  source: string;
  timestamp: Date;
  headers: Record<string, string>;
  /**
   * The parsed payload that the transformers read, required while signature
   * validation is off. While it is on, the collector parses it from the
   * verified `rawBody` instead, so it can be omitted and a value passed here
   * is replaced.
   */
  body?: any;
  /**
   * The request body exactly as received, before any parsing: the bytes the
   * sender signed. Prefer bytes, such as `await request.arrayBuffer()`;
   * `request.text()` drops a leading BOM and replaces invalid UTF-8.
   * Required while signature validation is on, and then it must be UTF-8
   * JSON. Its size in bytes counts against `maxPayloadSize` before the
   * signature is checked.
   */
  rawBody?: string | Uint8Array | ArrayBuffer;
  /** The signature to check when the signature header is missing. */
  signature?: string;
}

export interface WebhookCollectorConfig {
  /**
   * Verify each webhook's signature before collecting it. Defaults to `true`,
   * which needs `secretKey`; only `false` accepts unsigned webhooks.
   */
  enableSignatureValidation: boolean;
  /**
   * The header holding the signature, matched in any case. Its value is
   * `sha256=<hex>` or bare `<hex>`: the HMAC-SHA256 of `rawBody` keyed with
   * `secretKey`. Defaults to `x-signature`.
   */
  signatureHeader: string;
  /** The shared signing secret. Required while signature validation is on. */
  secretKey?: string;
  allowedSources: string[];
  /**
   * The largest payload accepted, in bytes: `rawBody` is measured before its
   * signature is checked, then `body` by the length of its JSON.
   */
  maxPayloadSize: number;
  rateLimitPerMinute: number;
}

export interface WebhookTransformer {
  canTransform(webhook: WebhookData): boolean;
  transform(webhook: WebhookData): Promise<EventData[]>;
}

// `sha256=<hex>` or bare `<hex>`, in any case.
const SHA256_SIGNATURE = /^(?:sha256=)?([0-9a-f]{64})$/i;

function findHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return undefined;
}

/**
 * Checks `signature` against the HMAC-SHA256 of `rawBody` keyed with
 * `secret`, comparing the digests in constant time.
 */
async function verifySha256Signature(
  rawBody: string | Uint8Array | ArrayBuffer,
  signature: string,
  secret: string,
): Promise<boolean> {
  const match = SHA256_SIGNATURE.exec(signature.trim());
  if (!match) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    typeof rawBody === "string"
      ? encoder.encode(rawBody)
      : new Uint8Array(rawBody),
  );
  return timingSafeEqual(new Uint8Array(expected), hexToBytes(match[1]));
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Looks at every byte, so the time taken does not reveal how much of a
// guessed digest was right.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// Every UTF-16 code unit takes at least one UTF-8 byte, so a string longer
// than `max` is refused without being encoded.
function exceedsBytes(
  rawBody: string | Uint8Array | ArrayBuffer,
  max: number,
): boolean {
  if (typeof rawBody !== "string") return rawBody.byteLength > max;
  return (
    rawBody.length > max || new TextEncoder().encode(rawBody).byteLength > max
  );
}

/**
 * Reads `rawBody` once, refuses it when it is over `max` bytes, and returns a
 * private copy. Strings are immutable and bytes are copied, so what is
 * measured, verified, parsed, and stored cannot change while verification
 * awaits WebCrypto.
 */
function copyRawBody(
  rawBody: WebhookData["rawBody"],
  max: number,
): WebhookData["rawBody"] {
  if (rawBody === undefined || rawBody === null) return rawBody;
  if (exceedsBytes(rawBody, max)) {
    throw new Error(`rawBody is larger than maxPayloadSize (${max} bytes)`);
  }
  if (typeof rawBody === "string") return rawBody;
  // `new Uint8Array(view)` copies the view (Node's `Buffer#slice` would share
  // it), but only wraps an ArrayBuffer, which `slice` copies instead.
  return ArrayBuffer.isView(rawBody)
    ? new Uint8Array(rawBody)
    : new Uint8Array(rawBody.slice(0));
}

// JSON on the wire is UTF-8, so malformed bytes are refused, not replaced.
function parseSignedJson(rawBody: string | Uint8Array | ArrayBuffer): unknown {
  try {
    const text =
      typeof rawBody === "string"
        ? rawBody
        : new TextDecoder("utf-8", { fatal: true }).decode(rawBody);
    return JSON.parse(text);
  } catch {
    throw new Error(
      "rawBody must be UTF-8 JSON while signature validation is on",
    );
  }
}

export class WebhookCollector extends EventEmitter {
  private config: WebhookCollectorConfig;
  private transformers: Map<string, WebhookTransformer> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private processedWebhooks: WebhookData[] = [];

  private defaultConfig: WebhookCollectorConfig = {
    enableSignatureValidation: true,
    signatureHeader: "x-signature",
    allowedSources: [],
    maxPayloadSize: 1024 * 1024, // 1MB
    rateLimitPerMinute: 1000,
  };

  constructor(config: Partial<WebhookCollectorConfig> = {}) {
    super();
    // An option passed as undefined keeps its default.
    const options = Object.fromEntries(
      Object.entries(config).filter(([, value]) => value !== undefined),
    ) as Partial<WebhookCollectorConfig>;
    this.config = { ...this.defaultConfig, ...options };
    // Only an explicit `false` turns validation off: a null, 0, or "" from
    // JavaScript or JSON-derived config leaves it on.
    this.config.enableSignatureValidation =
      this.config.enableSignatureValidation !== false;
    const { secretKey } = this.config;
    if (
      this.config.enableSignatureValidation &&
      (typeof secretKey !== "string" || secretKey === "")
    ) {
      throw new Error(
        "WebhookCollector needs a secretKey while enableSignatureValidation is on; set enableSignatureValidation: false to accept unsigned webhooks",
      );
    }
    this.initializeDefaultTransformers();
    this.startCleanup();
  }

  /**
   * 웹훅 수신 처리
   */
  async receiveWebhook(webhook: WebhookData): Promise<EventData[]> {
    // 레이트 리미팅 확인
    if (!this.checkRateLimit(webhook.source)) {
      throw new Error(`Rate limit exceeded for source: ${webhook.source}`);
    }

    // 원본 본문: 해시하거나 저장하기 전에 크기를 확인하고, 이후 단계는
    // 호출자가 바꿀 수 없는 사본만 쓴다
    const received: WebhookData = {
      ...webhook,
      rawBody: copyRawBody(webhook.rawBody, this.config.maxPayloadSize),
    };

    // 웹훅 검증 (서명 검증 시 body는 검증된 rawBody에서 파싱)
    const accepted = await this.validateWebhook(received);

    // 페이로드 크기 확인
    const payloadSize = JSON.stringify(accepted.body).length;
    if (payloadSize > this.config.maxPayloadSize) {
      throw new Error(
        `Payload size ${payloadSize} exceeds maximum ${this.config.maxPayloadSize}`,
      );
    }

    // 이벤트 변환
    const events = await this.transformWebhook(accepted);

    // 웹훅 저장 (감사 목적)
    this.processedWebhooks.push(accepted);

    // 최근 1000개만 유지
    if (this.processedWebhooks.length > 1000) {
      this.processedWebhooks = this.processedWebhooks.slice(-500);
    }

    this.emit("webhook:received", {
      webhook: accepted,
      eventCount: events.length,
    });
    return events;
  }

  /**
   * 웹훅 변환기 등록
   */
  registerTransformer(name: string, transformer: WebhookTransformer): void {
    this.transformers.set(name, transformer);
    this.emit("transformer:registered", { name });
  }

  /**
   * 웹훅 변환기 제거
   */
  unregisterTransformer(name: string): boolean {
    const removed = this.transformers.delete(name);
    if (removed) {
      this.emit("transformer:unregistered", { name });
    }
    return removed;
  }

  /**
   * 처리된 웹훅 조회
   */
  getProcessedWebhooks(since?: Date): WebhookData[] {
    if (!since) {
      return [...this.processedWebhooks];
    }

    return this.processedWebhooks.filter((w) => w.timestamp >= since);
  }

  /**
   * 웹훅 통계
   */
  getWebhookStats(): {
    totalProcessed: number;
    bySource: Record<string, number>;
    recentCount: number;
    transformerCount: number;
  } {
    const bySource: Record<string, number> = {};
    const recentTime = new Date(Date.now() - 60 * 60 * 1000); // 1시간

    let recentCount = 0;
    for (const webhook of this.processedWebhooks) {
      bySource[webhook.source] = (bySource[webhook.source] || 0) + 1;

      if (webhook.timestamp >= recentTime) {
        recentCount++;
      }
    }

    return {
      totalProcessed: this.processedWebhooks.length,
      bySource,
      recentCount,
      transformerCount: this.transformers.size,
    };
  }

  private async validateWebhook(webhook: WebhookData): Promise<WebhookData> {
    // 소스 검증
    if (
      this.config.allowedSources.length > 0 &&
      !this.config.allowedSources.includes(webhook.source)
    ) {
      throw new Error(`Source ${webhook.source} is not allowed`);
    }

    // 서명 검증: body를 서명된 바이트에서 파싱해, 서명되지 않은 body가
    // 변환기에 닿지 않게 한다
    const accepted = this.config.enableSignatureValidation
      ? { ...webhook, body: await this.validateSignature(webhook) }
      : webhook;

    // 기본 필드 검증
    if (!webhook.id) {
      throw new Error("Webhook ID is required");
    }

    if (!webhook.source) {
      throw new Error("Webhook source is required");
    }

    if (!webhook.timestamp || !(webhook.timestamp instanceof Date)) {
      throw new Error("Valid webhook timestamp is required");
    }

    // 서명 검증 중에는 항상 파싱된 값이 있으므로, 검증을 끈 경우에만 걸린다
    if (accepted.body === undefined) {
      throw new Error(
        "Webhook body is required while signature validation is off",
      );
    }

    return accepted;
  }

  /** Verifies the signature, then returns the JSON body it covers. */
  private async validateSignature(webhook: WebhookData): Promise<unknown> {
    const signature =
      findHeader(webhook.headers, this.config.signatureHeader) ||
      webhook.signature;

    if (!signature) {
      throw new Error(
        `Missing signature in header: ${this.config.signatureHeader}`,
      );
    }

    const secretKey = this.config.secretKey;
    if (!secretKey) {
      throw new Error("secretKey is required for signature validation");
    }

    // Verify and parse one value: the private copy from receiveWebhook().
    const { rawBody } = webhook;
    if (rawBody === undefined || rawBody === null) {
      throw new Error(
        "rawBody is required for signature validation: pass the request body exactly as received, before JSON parsing",
      );
    }

    if (!(await verifySha256Signature(rawBody, signature, secretKey))) {
      throw new Error("Invalid webhook signature");
    }

    return parseSignedJson(rawBody);
  }

  private checkRateLimit(source: string): boolean {
    const now = Date.now();
    const minuteKey = Math.floor(now / (60 * 1000));
    const rateLimitKey = `${source}_${minuteKey}`;

    const current = this.requestCounts.get(rateLimitKey) || {
      count: 0,
      resetTime: now + 60000,
    };

    if (current.count >= this.config.rateLimitPerMinute) {
      return false;
    }

    current.count++;
    this.requestCounts.set(rateLimitKey, current);
    return true;
  }

  private async transformWebhook(webhook: WebhookData): Promise<EventData[]> {
    const events: EventData[] = [];

    for (const [name, transformer] of this.transformers.entries()) {
      try {
        if (transformer.canTransform(webhook)) {
          const transformerEvents = await transformer.transform(webhook);
          events.push(...transformerEvents);
        }
      } catch (error) {
        this.emit("transformer:error", {
          transformerName: name,
          webhook,
          error,
        });
      }
    }

    if (events.length === 0) {
      // 기본 변환 로직
      events.push(await this.defaultTransform(webhook));
    }

    return events;
  }

  private async defaultTransform(webhook: WebhookData): Promise<EventData> {
    return {
      id: `webhook_${webhook.id}`,
      type: `webhook.${webhook.source}`,
      timestamp: webhook.timestamp,
      source: webhook.source,
      payload: webhook.body,
      context: {
        requestId: webhook.id,
        userAgent: webhook.headers["user-agent"],
        ipAddress:
          webhook.headers["x-forwarded-for"] || webhook.headers["x-real-ip"],
      },
    };
  }

  private initializeDefaultTransformers(): void {
    // SMS 프로바이더 웹훅 변환기
    this.registerTransformer("sms-provider", {
      canTransform: (webhook) =>
        webhook.source.includes("sms") || webhook.source.includes("alimtalk"),
      transform: async (webhook) => {
        const events: EventData[] = [];
        const body = webhook.body;

        // 전송 완료 이벤트
        if (body.status === "sent" || body.status === "delivered") {
          events.push({
            id: `sms_delivered_${webhook.id}`,
            type: "message.delivered",
            timestamp: webhook.timestamp,
            source: webhook.source,
            payload: {
              messageId: body.messageId || body.id,
              provider: webhook.source,
              channel: body.channel || "sms",
              recipientNumber: body.to || body.recipient,
              deliveryTime: body.deliveredAt
                ? new Date(body.deliveredAt)
                : webhook.timestamp,
            },
          });
        }

        // 전송 실패 이벤트
        if (body.status === "failed" || body.status === "error") {
          events.push({
            id: `sms_failed_${webhook.id}`,
            type: "message.failed",
            timestamp: webhook.timestamp,
            source: webhook.source,
            payload: {
              messageId: body.messageId || body.id,
              provider: webhook.source,
              channel: body.channel || "sms",
              errorCode: body.errorCode || "unknown",
              errorMessage: body.errorMessage || body.error,
              errorType: body.errorType || "delivery",
            },
          });
        }

        return events;
      },
    });

    // 알림톡 프로바이더 웹훅 변환기
    this.registerTransformer("alimtalk-provider", {
      canTransform: (webhook) =>
        webhook.source.includes("alimtalk") || webhook.source.includes("kakao"),
      transform: async (webhook) => {
        const events: EventData[] = [];
        const body = webhook.body;

        // 버튼 클릭 이벤트
        if (body.eventType === "click" || body.type === "button_click") {
          events.push({
            id: `alimtalk_click_${webhook.id}`,
            type: "message.clicked",
            timestamp: webhook.timestamp,
            source: webhook.source,
            payload: {
              messageId: body.messageId,
              provider: webhook.source,
              channel: "alimtalk",
              linkType: body.buttonType || "button",
              linkUrl: body.buttonUrl || body.url,
              buttonText: body.buttonText,
            },
          });
        }

        // 메시지 상태 변경
        if (body.messageStatus || body.status) {
          const status = body.messageStatus || body.status;

          if (["DELIVERED", "READ"].includes(status)) {
            events.push({
              id: `alimtalk_delivered_${webhook.id}`,
              type: "message.delivered",
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                messageId: body.messageId,
                provider: webhook.source,
                channel: "alimtalk",
                deliveryTime: body.deliveredAt
                  ? new Date(body.deliveredAt)
                  : webhook.timestamp,
              },
            });
          } else if (["FAILED", "REJECTED"].includes(status)) {
            events.push({
              id: `alimtalk_failed_${webhook.id}`,
              type: "message.failed",
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                messageId: body.messageId,
                provider: webhook.source,
                channel: "alimtalk",
                errorCode: body.failureCode || "unknown",
                errorMessage: body.failureReason || "Unknown error",
              },
            });
          }
        }

        return events;
      },
    });

    // 일반적인 메시징 프로바이더 웹훅 변환기
    this.registerTransformer("generic-messaging", {
      canTransform: (webhook) => {
        const body = webhook.body;
        return body && (body.messageId || body.id) && body.status;
      },
      transform: async (webhook) => {
        const events: EventData[] = [];
        const body = webhook.body;

        const basePayload = {
          messageId: body.messageId || body.id,
          provider: webhook.source,
          channel: body.channel || "unknown",
        };

        switch (body.status) {
          case "delivered":
          case "read":
            events.push({
              id: `generic_delivered_${webhook.id}`,
              type: "message.delivered",
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                ...basePayload,
                deliveryTime: body.deliveredAt
                  ? new Date(body.deliveredAt)
                  : webhook.timestamp,
              },
            });
            break;

          case "failed":
          case "rejected":
          case "undelivered":
            events.push({
              id: `generic_failed_${webhook.id}`,
              type: "message.failed",
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                ...basePayload,
                errorCode: body.errorCode || body.error_code || "unknown",
                errorMessage:
                  body.errorMessage || body.error_message || "Unknown error",
                errorType: body.errorType || "delivery",
              },
            });
            break;

          case "clicked":
            events.push({
              id: `generic_clicked_${webhook.id}`,
              type: "message.clicked",
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                ...basePayload,
                linkUrl: body.clickedUrl || body.url,
                linkType: body.linkType || "link",
              },
            });
            break;
        }

        return events;
      },
    });
  }

  private startCleanup(): void {
    // 레이트 리미트 카운터 정리 (매 5분)
    setInterval(
      () => {
        const now = Date.now();

        for (const [key, data] of this.requestCounts.entries()) {
          if (now > data.resetTime) {
            this.requestCounts.delete(key);
          }
        }
      },
      5 * 60 * 1000,
    );
  }
}
