import type {
  WebhookConfig,
  WebhookEvent,
  WebhookEndpoint,
  WebhookDelivery,
  WebhookStats,
  WebhookTestResult
} from '../types/webhook.types';
import { WebhookEventType } from '../types/webhook.types';
import { WebhookDispatcher, type HttpClient } from './webhook.dispatcher';
import { WebhookRegistry } from './webhook.registry';
import { SecurityManager } from '../security/security.manager';
import { RetryManager } from '../retry/retry.manager';

export class WebhookService {
  private config: WebhookConfig;
  private dispatcher: WebhookDispatcher;
  private registry: WebhookRegistry;
  private securityManager: SecurityManager;
  private retryManager: RetryManager;
  private eventQueue: WebhookEvent[] = [];
  private batchProcessor: NodeJS.Timeout | null = null;

  constructor(config: WebhookConfig, httpClient?: HttpClient) {
    this.config = config;
    this.dispatcher = new WebhookDispatcher(config, httpClient);
    this.registry = new WebhookRegistry();
    this.securityManager = new SecurityManager(config);
    this.retryManager = new RetryManager(config);

    this.startBatchProcessor();
  }

  /**
   * 웹훅 엔드포인트 등록
   */
  async registerEndpoint(endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<WebhookEndpoint> {
    // URL 유효성 검사
    await this.validateEndpointUrl(endpoint.url);

    const newEndpoint: WebhookEndpoint = {
      ...endpoint,
      id: this.generateEndpointId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    await this.registry.addEndpoint(newEndpoint);
    
    // 테스트 웹훅 전송
    await this.testEndpoint(newEndpoint.id);

    return newEndpoint;
  }

  /**
   * 웹훅 엔드포인트 수정
   */
  async updateEndpoint(endpointId: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint> {
    const endpoint = await this.registry.getEndpoint(endpointId);
    if (!endpoint) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    // URL이 변경된 경우 검증
    if (updates.url && updates.url !== endpoint.url) {
      await this.validateEndpointUrl(updates.url);
    }

    const updatedEndpoint = {
      ...endpoint,
      ...updates,
      updatedAt: new Date(),
    };

    await this.registry.updateEndpoint(endpointId, updatedEndpoint);
    return updatedEndpoint;
  }

  /**
   * 웹훅 엔드포인트 삭제
   */
  async deleteEndpoint(endpointId: string): Promise<void> {
    await this.registry.removeEndpoint(endpointId);
  }

  /**
   * 웹훅 엔드포인트 조회
   */
  async getEndpoint(endpointId: string): Promise<WebhookEndpoint | null> {
    return this.registry.getEndpoint(endpointId);
  }

  /**
   * 모든 웹훅 엔드포인트 조회
   */
  async listEndpoints(): Promise<WebhookEndpoint[]> {
    return this.registry.listEndpoints();
  }

  /**
   * 이벤트 발생 (비동기 처리)
   */
  async emit(event: WebhookEvent): Promise<void> {
    // 활성화된 이벤트 타입인지 확인
    if (!this.config.enabledEvents.includes(event.type)) {
      return;
    }

    // 이벤트 검증
    this.validateEvent(event);

    // 큐에 추가
    this.eventQueue.push(event);

    // 배치 크기에 도달한 경우 즉시 처리
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.processBatch();
    }
  }

  /**
   * 이벤트 발생 (동기 처리)
   */
  async emitSync(event: WebhookEvent): Promise<WebhookDelivery[]> {
    this.validateEvent(event);

    const endpoints = await this.getMatchingEndpoints(event);
    const deliveries: WebhookDelivery[] = [];

    for (const endpoint of endpoints) {
      const delivery = await this.dispatcher.dispatch(event, endpoint);
      deliveries.push(delivery);
    }

    return deliveries;
  }

  /**
   * 웹훅 엔드포인트 테스트
   */
  async testEndpoint(endpointId: string): Promise<WebhookTestResult> {
    const endpoint = await this.registry.getEndpoint(endpointId);
    if (!endpoint) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    const testEvent: WebhookEvent = {
      id: `test_${Date.now()}`,
      type: WebhookEventType.SYSTEM_MAINTENANCE, // 테스트용 이벤트
      timestamp: new Date(),
      data: {
        test: true,
        message: 'This is a test webhook',
      },
      metadata: {
        correlationId: `test_${endpointId}`,
      },
      version: '1.0',
    };

    const startTime = Date.now();
    
    try {
      const delivery = await this.dispatcher.dispatch(testEvent, endpoint);
      const endTime = Date.now();

      return {
        endpointId,
        url: endpoint.url,
        success: delivery.status === 'success',
        httpStatus: delivery.attempts[0]?.httpStatus,
        responseTime: endTime - startTime,
        testedAt: new Date(),
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        endpointId,
        url: endpoint.url,
        success: false,
        responseTime: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        testedAt: new Date(),
      };
    }
  }

  /**
   * 웹훅 통계 조회
   */
  async getStats(endpointId: string, timeRange: { start: Date; end: Date }): Promise<WebhookStats> {
    const deliveries = await this.registry.getDeliveries(endpointId, timeRange);
    
    const successful = deliveries.filter(d => d.status === 'success');
    const failed = deliveries.filter(d => d.status === 'failed' || d.status === 'exhausted');
    
    const totalLatency = deliveries.reduce((sum, d) => {
      const lastAttempt = d.attempts[d.attempts.length - 1];
      return sum + (lastAttempt?.latencyMs || 0);
    }, 0);

    const eventBreakdown: Record<WebhookEventType, number> = {} as any;
    const errorBreakdown: Record<string, number> = {};

    for (const delivery of deliveries) {
      // 이벤트 유형별 집계는 실제 구현에서 이벤트 정보를 조회해야 함
      
      // 에러 유형별 집계
      if (delivery.status === 'failed' || delivery.status === 'exhausted') {
        const lastAttempt = delivery.attempts[delivery.attempts.length - 1];
        const errorKey = lastAttempt?.error || `HTTP ${lastAttempt?.httpStatus || 'Unknown'}`;
        errorBreakdown[errorKey] = (errorBreakdown[errorKey] || 0) + 1;
      }
    }

    return {
      endpointId,
      timeRange,
      totalDeliveries: deliveries.length,
      successfulDeliveries: successful.length,
      failedDeliveries: failed.length,
      averageLatencyMs: deliveries.length > 0 ? totalLatency / deliveries.length : 0,
      successRate: deliveries.length > 0 ? (successful.length / deliveries.length) * 100 : 0,
      eventBreakdown,
      errorBreakdown,
    };
  }

  /**
   * 실패한 웹훅 재시도
   */
  async retryFailed(endpointId?: string, eventType?: WebhookEventType): Promise<number> {
    const failedDeliveries = await this.registry.getFailedDeliveries(endpointId, eventType);
    let retriedCount = 0;

    for (const delivery of failedDeliveries) {
      const attemptCount = delivery.attempts.length;
      if (this.retryManager.shouldRetry(attemptCount)) {
        // 재시도 스케줄링 (실제 구현에서는 큐 시스템 사용)
        setTimeout(async () => {
          const endpoint = await this.registry.getEndpoint(delivery.endpointId);
          if (endpoint) {
            await this.dispatcher.dispatch(
              JSON.parse(delivery.payload), 
              endpoint
            );
          }
        }, this.retryManager.getBackoffDelay(attemptCount));
        retriedCount++;
      }
    }

    return retriedCount;
  }

  /**
   * 웹훅 일시 중단
   */
  async pauseEndpoint(endpointId: string): Promise<void> {
    await this.updateEndpoint(endpointId, { status: 'suspended' });
  }

  /**
   * 웹훅 재개
   */
  async resumeEndpoint(endpointId: string): Promise<void> {
    await this.updateEndpoint(endpointId, { status: 'active' });
  }

  /**
   * 웹훅 전달 내역 조회
   */
  async getDeliveries(
    endpointId?: string,
    eventType?: WebhookEventType,
    status?: string,
    limit = 100
  ): Promise<WebhookDelivery[]> {
    return this.registry.getDeliveries(endpointId, undefined, eventType, status, limit);
  }

  private async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const batch = this.eventQueue.splice(0, this.config.batchSize);
    
    try {
      for (const event of batch) {
        const endpoints = await this.getMatchingEndpoints(event);
        
        for (const endpoint of endpoints) {
          // 비동기로 전달 (에러가 발생해도 다른 엔드포인트에 영향 없음)
          this.dispatcher.dispatch(event, endpoint).catch(error => {
            console.error(`Failed to dispatch webhook to ${endpoint.url}:`, error);
          });
        }
      }
    } catch (error) {
      console.error('Batch processing failed:', error);
      // 실패한 이벤트를 다시 큐에 추가 (재시도)
      this.eventQueue.unshift(...batch);
    }
  }

  private async getMatchingEndpoints(event: WebhookEvent): Promise<WebhookEndpoint[]> {
    const allEndpoints = await this.registry.listEndpoints();
    
    return allEndpoints.filter(endpoint => {
      // 비활성 엔드포인트 제외
      if (endpoint.status !== 'active') {
        return false;
      }

      // 이벤트 타입 필터
      if (!endpoint.events.includes(event.type)) {
        return false;
      }

      // 추가 필터 적용
      if (endpoint.filters) {
        if (endpoint.filters.providerId && event.metadata.providerId) {
          if (!endpoint.filters.providerId.includes(event.metadata.providerId)) {
            return false;
          }
        }

        if (endpoint.filters.channelId && event.metadata.channelId) {
          if (!endpoint.filters.channelId.includes(event.metadata.channelId)) {
            return false;
          }
        }

        if (endpoint.filters.templateId && event.metadata.templateId) {
          if (!endpoint.filters.templateId.includes(event.metadata.templateId)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  private validateEvent(event: WebhookEvent): void {
    if (!event.id) {
      throw new Error('Event ID is required');
    }

    if (!event.type) {
      throw new Error('Event type is required');
    }

    if (!event.timestamp) {
      throw new Error('Event timestamp is required');
    }

    if (!event.version) {
      throw new Error('Event version is required');
    }
  }

  private async validateEndpointUrl(url: string): Promise<void> {
    try {
      const parsedUrl = new URL(url);
      
      // HTTPS 필수 (개발 환경 제외)
      if (parsedUrl.protocol !== 'https:' && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        throw new Error('Webhook URL must use HTTPS');
      }

      // 로컬호스트 및 프라이빗 IP 차단 (프로덕션에서)
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
          throw new Error('Private IP addresses are not allowed in production');
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid webhook URL');
    }
  }

  private generateEndpointId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private startBatchProcessor(): void {
    this.batchProcessor = setInterval(async () => {
      try {
        await this.processBatch();
      } catch (error) {
        console.error('Batch processor error:', error);
      }
    }, this.config.batchTimeoutMs);
  }

  /**
   * 서비스 종료 시 정리
   */
  async shutdown(): Promise<void> {
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
      this.batchProcessor = null;
    }

    // 남은 이벤트 처리
    if (this.eventQueue.length > 0) {
      await this.processBatch();
    }

    await this.dispatcher.shutdown();
    // RetryManager는 상태가 없으므로 정리 불필요
  }
}