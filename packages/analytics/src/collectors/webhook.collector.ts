/**
 * Webhook Collector
 * 웹훅을 통한 외부 이벤트 수집
 */

import { EventEmitter } from 'events';
import type { EventData } from './event.collector';
import type { MetricData, MetricType } from '../types/analytics.types';

export interface WebhookData {
  id: string;
  source: string;
  timestamp: Date;
  headers: Record<string, string>;
  body: any;
  signature?: string;
}

export interface WebhookCollectorConfig {
  enableSignatureValidation: boolean;
  signatureHeader: string;
  secretKey?: string;
  allowedSources: string[];
  maxPayloadSize: number; // bytes
  rateLimitPerMinute: number;
}

export interface WebhookTransformer {
  canTransform(webhook: WebhookData): boolean;
  transform(webhook: WebhookData): Promise<EventData[]>;
}

export class WebhookCollector extends EventEmitter {
  private config: WebhookCollectorConfig;
  private transformers: Map<string, WebhookTransformer> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private processedWebhooks: WebhookData[] = [];

  private defaultConfig: WebhookCollectorConfig = {
    enableSignatureValidation: true,
    signatureHeader: 'x-signature',
    allowedSources: [],
    maxPayloadSize: 1024 * 1024, // 1MB
    rateLimitPerMinute: 1000
  };

  constructor(config: Partial<WebhookCollectorConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
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

    // 웹훅 검증
    await this.validateWebhook(webhook);

    // 페이로드 크기 확인
    const payloadSize = JSON.stringify(webhook.body).length;
    if (payloadSize > this.config.maxPayloadSize) {
      throw new Error(`Payload size ${payloadSize} exceeds maximum ${this.config.maxPayloadSize}`);
    }

    // 이벤트 변환
    const events = await this.transformWebhook(webhook);

    // 웹훅 저장 (감사 목적)
    this.processedWebhooks.push(webhook);
    
    // 최근 1000개만 유지
    if (this.processedWebhooks.length > 1000) {
      this.processedWebhooks = this.processedWebhooks.slice(-500);
    }

    this.emit('webhook:received', { webhook, eventCount: events.length });
    return events;
  }

  /**
   * 웹훅 변환기 등록
   */
  registerTransformer(name: string, transformer: WebhookTransformer): void {
    this.transformers.set(name, transformer);
    this.emit('transformer:registered', { name });
  }

  /**
   * 웹훅 변환기 제거
   */
  unregisterTransformer(name: string): boolean {
    const removed = this.transformers.delete(name);
    if (removed) {
      this.emit('transformer:unregistered', { name });
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

    return this.processedWebhooks.filter(w => w.timestamp >= since);
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
      transformerCount: this.transformers.size
    };
  }

  private async validateWebhook(webhook: WebhookData): Promise<void> {
    // 소스 검증
    if (this.config.allowedSources.length > 0 && !this.config.allowedSources.includes(webhook.source)) {
      throw new Error(`Source ${webhook.source} is not allowed`);
    }

    // 서명 검증
    if (this.config.enableSignatureValidation && this.config.secretKey) {
      await this.validateSignature(webhook);
    }

    // 기본 필드 검증
    if (!webhook.id) {
      throw new Error('Webhook ID is required');
    }

    if (!webhook.source) {
      throw new Error('Webhook source is required');
    }

    if (!webhook.timestamp || !(webhook.timestamp instanceof Date)) {
      throw new Error('Valid webhook timestamp is required');
    }
  }

  private async validateSignature(webhook: WebhookData): Promise<void> {
    const signature = webhook.headers[this.config.signatureHeader] || webhook.signature;
    
    if (!signature) {
      throw new Error(`Missing signature in header: ${this.config.signatureHeader}`);
    }

    // 간단한 HMAC 검증 (실제로는 crypto 모듈 사용)
    const expectedSignature = await this.generateSignature(webhook.body, this.config.secretKey!);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }
  }

  private async generateSignature(payload: any, secret: string): Promise<string> {
    // 실제 구현에서는 crypto.createHmac 사용
    const payloadStr = JSON.stringify(payload);
    return `sha256=${payloadStr.length}_${secret.length}`; // 임시 구현
  }

  private checkRateLimit(source: string): boolean {
    const now = Date.now();
    const minuteKey = Math.floor(now / (60 * 1000));
    const rateLimitKey = `${source}_${minuteKey}`;
    
    const current = this.requestCounts.get(rateLimitKey) || { count: 0, resetTime: now + 60000 };
    
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
        this.emit('transformer:error', { transformerName: name, webhook, error });
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
        userAgent: webhook.headers['user-agent'],
        ipAddress: webhook.headers['x-forwarded-for'] || webhook.headers['x-real-ip']
      }
    };
  }

  private initializeDefaultTransformers(): void {
    // SMS 프로바이더 웹훅 변환기
    this.registerTransformer('sms-provider', {
      canTransform: (webhook) => webhook.source.includes('sms') || webhook.source.includes('alimtalk'),
      transform: async (webhook) => {
        const events: EventData[] = [];
        const body = webhook.body;

        // 전송 완료 이벤트
        if (body.status === 'sent' || body.status === 'delivered') {
          events.push({
            id: `sms_delivered_${webhook.id}`,
            type: 'message.delivered',
            timestamp: webhook.timestamp,
            source: webhook.source,
            payload: {
              messageId: body.messageId || body.id,
              provider: webhook.source,
              channel: body.channel || 'sms',
              recipientNumber: body.to || body.recipient,
              deliveryTime: body.deliveredAt ? new Date(body.deliveredAt) : webhook.timestamp
            }
          });
        }

        // 전송 실패 이벤트
        if (body.status === 'failed' || body.status === 'error') {
          events.push({
            id: `sms_failed_${webhook.id}`,
            type: 'message.failed',
            timestamp: webhook.timestamp,
            source: webhook.source,
            payload: {
              messageId: body.messageId || body.id,
              provider: webhook.source,
              channel: body.channel || 'sms',
              errorCode: body.errorCode || 'unknown',
              errorMessage: body.errorMessage || body.error,
              errorType: body.errorType || 'delivery'
            }
          });
        }

        return events;
      }
    });

    // 알림톡 프로바이더 웹훅 변환기
    this.registerTransformer('alimtalk-provider', {
      canTransform: (webhook) => webhook.source.includes('alimtalk') || webhook.source.includes('kakao'),
      transform: async (webhook) => {
        const events: EventData[] = [];
        const body = webhook.body;

        // 버튼 클릭 이벤트
        if (body.eventType === 'click' || body.type === 'button_click') {
          events.push({
            id: `alimtalk_click_${webhook.id}`,
            type: 'message.clicked',
            timestamp: webhook.timestamp,
            source: webhook.source,
            payload: {
              messageId: body.messageId,
              provider: webhook.source,
              channel: 'alimtalk',
              linkType: body.buttonType || 'button',
              linkUrl: body.buttonUrl || body.url,
              buttonText: body.buttonText
            }
          });
        }

        // 메시지 상태 변경
        if (body.messageStatus || body.status) {
          const status = body.messageStatus || body.status;
          
          if (['DELIVERED', 'READ'].includes(status)) {
            events.push({
              id: `alimtalk_delivered_${webhook.id}`,
              type: 'message.delivered',
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                messageId: body.messageId,
                provider: webhook.source,
                channel: 'alimtalk',
                deliveryTime: body.deliveredAt ? new Date(body.deliveredAt) : webhook.timestamp
              }
            });
          } else if (['FAILED', 'REJECTED'].includes(status)) {
            events.push({
              id: `alimtalk_failed_${webhook.id}`,
              type: 'message.failed',
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                messageId: body.messageId,
                provider: webhook.source,
                channel: 'alimtalk',
                errorCode: body.failureCode || 'unknown',
                errorMessage: body.failureReason || 'Unknown error'
              }
            });
          }
        }

        return events;
      }
    });

    // 일반적인 메시징 프로바이더 웹훅 변환기
    this.registerTransformer('generic-messaging', {
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
          channel: body.channel || 'unknown'
        };

        switch (body.status) {
          case 'delivered':
          case 'read':
            events.push({
              id: `generic_delivered_${webhook.id}`,
              type: 'message.delivered',
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                ...basePayload,
                deliveryTime: body.deliveredAt ? new Date(body.deliveredAt) : webhook.timestamp
              }
            });
            break;

          case 'failed':
          case 'rejected':
          case 'undelivered':
            events.push({
              id: `generic_failed_${webhook.id}`,
              type: 'message.failed',
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                ...basePayload,
                errorCode: body.errorCode || body.error_code || 'unknown',
                errorMessage: body.errorMessage || body.error_message || 'Unknown error',
                errorType: body.errorType || 'delivery'
              }
            });
            break;

          case 'clicked':
            events.push({
              id: `generic_clicked_${webhook.id}`,
              type: 'message.clicked',
              timestamp: webhook.timestamp,
              source: webhook.source,
              payload: {
                ...basePayload,
                linkUrl: body.clickedUrl || body.url,
                linkType: body.linkType || 'link'
              }
            });
            break;
        }

        return events;
      }
    });
  }

  private startCleanup(): void {
    // 레이트 리미트 카운터 정리 (매 5분)
    setInterval(() => {
      const now = Date.now();
      
      for (const [key, data] of this.requestCounts.entries()) {
        if (now > data.resetTime) {
          this.requestCounts.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
}