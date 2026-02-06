/**
 * Event Collector
 * 실시간 이벤트 수집 및 메트릭 변환
 */

import { EventEmitter } from 'events';
import type { MetricData } from '../types/analytics.types';
import { MetricType } from '../types/analytics.types';

export interface EventData {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  payload: Record<string, any>;
  context?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
}

export interface EventCollectorConfig {
  bufferSize: number;
  flushInterval: number; // ms
  enableDeduplication: boolean;
  deduplicationWindow: number; // ms
  enableSampling: boolean;
  samplingRate: number; // 0-1
}

export interface EventProcessor {
  canProcess(event: EventData): boolean;
  process(event: EventData): Promise<MetricData[]>;
}

export class EventCollector extends EventEmitter {
  private config: EventCollectorConfig;
  private buffer: EventData[] = [];
  private processors: Map<string, EventProcessor> = new Map();
  private recentEvents: Map<string, number> = new Map(); // 중복 제거용
  private metrics: MetricData[] = [];

  private defaultConfig: EventCollectorConfig = {
    bufferSize: 1000,
    flushInterval: 5000,
    enableDeduplication: true,
    deduplicationWindow: 60000, // 1분
    enableSampling: false,
    samplingRate: 1.0
  };

  constructor(config: Partial<EventCollectorConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
    this.initializeDefaultProcessors();
    this.startPeriodicFlush();
    this.startCleanup();
  }

  /**
   * 이벤트 수집
   */
  async collectEvent(event: EventData): Promise<void> {
    // 샘플링 확인
    if (this.config.enableSampling && Math.random() > this.config.samplingRate) {
      return;
    }

    // 중복 제거
    if (this.config.enableDeduplication && this.isDuplicate(event)) {
      return;
    }

    // 이벤트 검증
    this.validateEvent(event);

    // 버퍼에 추가
    this.buffer.push(event);

    // 즉시 처리가 필요한 경우
    if (this.isHighPriorityEvent(event)) {
      await this.processEvent(event);
    }

    // 버퍼가 가득 찬 경우 플러시
    if (this.buffer.length >= this.config.bufferSize) {
      await this.flush();
    }

    this.emit('event:collected', event);
  }

  /**
   * 배치 이벤트 수집
   */
  async collectEvents(events: EventData[]): Promise<void> {
    for (const event of events) {
      await this.collectEvent(event);
    }
  }

  /**
   * 커스텀 이벤트 프로세서 등록
   */
  registerProcessor(name: string, processor: EventProcessor): void {
    this.processors.set(name, processor);
    this.emit('processor:registered', { name, processor });
  }

  /**
   * 이벤트 프로세서 제거
   */
  unregisterProcessor(name: string): boolean {
    const removed = this.processors.delete(name);
    if (removed) {
      this.emit('processor:unregistered', { name });
    }
    return removed;
  }

  /**
   * 수집된 메트릭 조회
   */
  getCollectedMetrics(since?: Date): MetricData[] {
    if (!since) {
      return [...this.metrics];
    }

    return this.metrics.filter(m => m.timestamp >= since);
  }

  /**
   * 실시간 메트릭 스트림
   */
  async *streamMetrics(): AsyncGenerator<MetricData[]> {
    while (true) {
      await new Promise(resolve => setTimeout(resolve, this.config.flushInterval));
      
      if (this.buffer.length > 0) {
        await this.flush();
      }

      const recentMetrics = this.getCollectedMetrics(
        new Date(Date.now() - this.config.flushInterval)
      );

      if (recentMetrics.length > 0) {
        yield recentMetrics;
      }
    }
  }

  /**
   * 이벤트 통계
   */
  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySource: Record<string, number>;
    bufferSize: number;
    metricsGenerated: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};

    // 버퍼의 이벤트 통계
    for (const event of this.buffer) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
    }

    return {
      totalEvents: this.buffer.length,
      eventsByType,
      eventsBySource,
      bufferSize: this.buffer.length,
      metricsGenerated: this.metrics.length
    };
  }

  /**
   * 버퍼 강제 플러시
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const events = [...this.buffer];
    this.buffer = [];

    try {
      const allMetrics: MetricData[] = [];

      for (const event of events) {
        const metrics = await this.processEvent(event);
        allMetrics.push(...metrics);
      }

      this.metrics.push(...allMetrics);

      // 메트릭 제한 (메모리 관리)
      if (this.metrics.length > 100000) {
        this.metrics = this.metrics.slice(-50000); // 최근 50,000개만 유지
      }

      this.emit('events:flushed', { 
        eventCount: events.length, 
        metricCount: allMetrics.length 
      });

    } catch (error) {
      // 실패한 이벤트를 다시 버퍼에 추가
      this.buffer.unshift(...events);
      this.emit('flush:error', error);
      throw error;
    }
  }

  private async processEvent(event: EventData): Promise<MetricData[]> {
    const metrics: MetricData[] = [];

    for (const [name, processor] of this.processors.entries()) {
      try {
        if (processor.canProcess(event)) {
          const processorMetrics = await processor.process(event);
          metrics.push(...processorMetrics);
        }
      } catch (error) {
        this.emit('processor:error', { processorName: name, event, error });
      }
    }

    return metrics;
  }

  private validateEvent(event: EventData): void {
    if (!event.id) {
      throw new Error('Event ID is required');
    }

    if (!event.type) {
      throw new Error('Event type is required');
    }

    if (!event.timestamp || !(event.timestamp instanceof Date)) {
      throw new Error('Valid event timestamp is required');
    }

    if (!event.source) {
      throw new Error('Event source is required');
    }

    if (!event.payload || typeof event.payload !== 'object') {
      throw new Error('Event payload must be an object');
    }
  }

  private isDuplicate(event: EventData): boolean {
    const now = Date.now();
    const eventKey = `${event.id}_${event.type}_${event.source}`;
    const lastSeen = this.recentEvents.get(eventKey);

    if (lastSeen && (now - lastSeen) < this.config.deduplicationWindow) {
      return true;
    }

    this.recentEvents.set(eventKey, now);
    return false;
  }

  private isHighPriorityEvent(event: EventData): boolean {
    // 높은 우선순위 이벤트 타입들
    const highPriorityTypes = [
      'message.failed',
      'system.error',
      'security.alert',
      'performance.degradation'
    ];

    return highPriorityTypes.includes(event.type);
  }

  private initializeDefaultProcessors(): void {
    // 메시지 전송 프로세서
    this.registerProcessor('message-sent', {
      canProcess: (event) => event.type === 'message.sent',
      process: async (event) => {
        return [{
          id: `metric_${event.id}`,
          type: MetricType.MESSAGE_SENT,
          timestamp: event.timestamp,
          value: 1,
          dimensions: {
            provider: event.payload.provider || 'unknown',
            channel: event.payload.channel || 'unknown',
            template: event.payload.templateId || 'none'
          },
          metadata: {
            messageId: event.payload.messageId,
            recipientCount: event.payload.recipientCount || 1
          }
        }];
      }
    });

    // 메시지 전달 프로세서
    this.registerProcessor('message-delivered', {
      canProcess: (event) => event.type === 'message.delivered',
      process: async (event) => {
        return [{
          id: `metric_${event.id}`,
          type: MetricType.MESSAGE_DELIVERED,
          timestamp: event.timestamp,
          value: 1,
          dimensions: {
            provider: event.payload.provider || 'unknown',
            channel: event.payload.channel || 'unknown'
          },
          metadata: {
            messageId: event.payload.messageId,
            deliveryTime: event.payload.deliveryTime
          }
        }];
      }
    });

    // 메시지 실패 프로세서
    this.registerProcessor('message-failed', {
      canProcess: (event) => event.type === 'message.failed',
      process: async (event) => {
        return [{
          id: `metric_${event.id}`,
          type: MetricType.MESSAGE_FAILED,
          timestamp: event.timestamp,
          value: 1,
          dimensions: {
            provider: event.payload.provider || 'unknown',
            channel: event.payload.channel || 'unknown',
            errorCode: event.payload.errorCode || 'unknown'
          },
          metadata: {
            messageId: event.payload.messageId,
            errorMessage: event.payload.errorMessage,
            errorType: event.payload.errorType
          }
        }];
      }
    });

    // 메시지 클릭 프로세서
    this.registerProcessor('message-clicked', {
      canProcess: (event) => event.type === 'message.clicked' || event.type === 'link.clicked',
      process: async (event) => {
        return [{
          id: `metric_${event.id}`,
          type: MetricType.MESSAGE_CLICKED,
          timestamp: event.timestamp,
          value: 1,
          dimensions: {
            provider: event.payload.provider || 'unknown',
            channel: event.payload.channel || 'unknown',
            linkType: event.payload.linkType || 'unknown'
          },
          metadata: {
            messageId: event.payload.messageId,
            linkUrl: event.payload.linkUrl,
            userId: event.context?.userId
          }
        }];
      }
    });

    // 템플릿 사용 프로세서
    this.registerProcessor('template-used', {
      canProcess: (event) => event.type === 'template.used',
      process: async (event) => {
        return [{
          id: `metric_${event.id}`,
          type: MetricType.TEMPLATE_USAGE,
          timestamp: event.timestamp,
          value: 1,
          dimensions: {
            templateId: event.payload.templateId || 'unknown',
            provider: event.payload.provider || 'unknown',
            channel: event.payload.channel || 'unknown'
          },
          metadata: {
            templateName: event.payload.templateName,
            version: event.payload.version
          }
        }];
      }
    });

    // 채널 사용 프로세서
    this.registerProcessor('channel-used', {
      canProcess: (event) => ['message.sent', 'message.delivered'].includes(event.type),
      process: async (event) => {
        return [{
          id: `metric_channel_${event.id}`,
          type: MetricType.CHANNEL_USAGE,
          timestamp: event.timestamp,
          value: 1,
          dimensions: {
            channel: event.payload.channel || 'unknown',
            provider: event.payload.provider || 'unknown'
          }
        }];
      }
    });
  }

  private startPeriodicFlush(): void {
    setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        this.emit('flush:error', error);
      }
    }, this.config.flushInterval);
  }

  private startCleanup(): void {
    // 중복 제거 캐시 정리 (매 10분)
    setInterval(() => {
      const cutoff = Date.now() - this.config.deduplicationWindow;
      
      for (const [key, timestamp] of this.recentEvents.entries()) {
        if (timestamp < cutoff) {
          this.recentEvents.delete(key);
        }
      }
    }, 10 * 60 * 1000);

    // 메트릭 정리 (매 시간)
    setInterval(() => {
      if (this.metrics.length > 100000) {
        this.metrics = this.metrics.slice(-50000);
        this.emit('metrics:cleaned', { remainingCount: this.metrics.length });
      }
    }, 60 * 60 * 1000);
  }
}