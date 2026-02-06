/**
 * Event Store
 * 웹훅 이벤트 저장 및 관리
 */

import type { WebhookEvent } from '../types/webhook.types';
import { WebhookEventType } from '../types/webhook.types';
import type { EventFilter, PaginationOptions, SearchResult, StorageConfig } from './types';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export class EventStore extends EventEmitter {
  private config: StorageConfig;
  private events: Map<string, WebhookEvent> = new Map();
  private indexByType: Map<WebhookEventType, Set<string>> = new Map();
  private indexByDate: Map<string, Set<string>> = new Map(); // YYYY-MM-DD -> event ids
  private indexByProvider: Map<string, Set<string>> = new Map();
  private indexByChannel: Map<string, Set<string>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private defaultConfig: StorageConfig = {
    type: 'memory',
    retentionDays: 7,
    enableCompression: false,
    maxMemoryUsage: 50 * 1024 * 1024 // 50MB
  };

  constructor(config: Partial<StorageConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
    
    this.initializeIndexes();
    this.startCleanupTask();
    
    if (this.config.type === 'file' && this.config.filePath) {
      this.loadFromFile().catch(error => {
        this.emit('loadError', error);
      });
    }
  }

  /**
   * 이벤트 저장
   */
  async saveEvent(event: WebhookEvent): Promise<void> {
    // 중복 이벤트 확인
    if (this.events.has(event.id)) {
      this.emit('duplicateEvent', { eventId: event.id });
      return;
    }

    // 메모리 사용량 확인
    if (this.config.type === 'memory' && this.config.maxMemoryUsage) {
      await this.checkMemoryUsage();
    }

    // 이벤트 저장
    this.events.set(event.id, event);
    this.addToIndexes(event);

    // 파일 저장
    if (this.config.type === 'file') {
      await this.appendToFile(event);
    }

    this.emit('eventSaved', { 
      eventId: event.id, 
      type: event.type,
      providerId: event.metadata.providerId 
    });
  }

  /**
   * 이벤트 조회
   */
  async getEvent(eventId: string): Promise<WebhookEvent | null> {
    return this.events.get(eventId) || null;
  }

  /**
   * 필터 조건에 맞는 이벤트 검색
   */
  async searchEvents(
    filter: EventFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 100 }
  ): Promise<SearchResult<WebhookEvent>> {
    let candidateIds: Set<string> | null = null;

    // 이벤트 타입 필터 적용
    if (filter.type && filter.type.length > 0) {
      const typeIds = new Set<string>();
      for (const eventType of filter.type) {
        const ids = this.indexByType.get(eventType);
        if (ids) {
          ids.forEach(id => typeIds.add(id));
        }
      }
      candidateIds = typeIds;
    }

    // 프로바이더 필터 적용
    if (filter.providerId && filter.providerId.length > 0) {
      const providerIds = new Set<string>();
      for (const providerId of filter.providerId) {
        const ids = this.indexByProvider.get(providerId);
        if (ids) {
          ids.forEach(id => providerIds.add(id));
        }
      }
      
      if (candidateIds) {
        candidateIds = new Set(Array.from(candidateIds).filter(id => providerIds.has(id)));
      } else {
        candidateIds = providerIds;
      }
    }

    // 채널 필터 적용
    if (filter.channelId && filter.channelId.length > 0) {
      const channelIds = new Set<string>();
      for (const channelId of filter.channelId) {
        const ids = this.indexByChannel.get(channelId);
        if (ids) {
          ids.forEach(id => channelIds.add(id));
        }
      }
      
      if (candidateIds) {
        candidateIds = new Set(Array.from(candidateIds).filter(id => channelIds.has(id)));
      } else {
        candidateIds = channelIds;
      }
    }

    // 날짜 범위 필터 적용
    if (filter.createdAfter || filter.createdBefore) {
      const dateIds = this.getEventIdsByDateRange(filter.createdAfter, filter.createdBefore);
      if (candidateIds) {
        candidateIds = new Set(Array.from(candidateIds).filter(id => dateIds.has(id)));
      } else {
        candidateIds = dateIds;
      }
    }

    // 후보가 없으면 모든 이벤트를 대상으로
    if (!candidateIds) {
      candidateIds = new Set(this.events.keys());
    }

    // 추가 필터 적용
    const filteredEvents = Array.from(candidateIds)
      .map(id => this.events.get(id)!)
      .filter(event => this.matchesFilter(event, filter));

    // 정렬 (기본: 최신순)
    filteredEvents.sort((a, b) => {
      if (pagination.sortBy === 'timestamp' || !pagination.sortBy) {
        const comparison = b.timestamp.getTime() - a.timestamp.getTime();
        return pagination.sortOrder === 'asc' ? -comparison : comparison;
      }
      
      const aValue = this.getFieldValue(a, pagination.sortBy);
      const bValue = this.getFieldValue(b, pagination.sortBy);
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      return pagination.sortOrder === 'desc' ? -comparison : comparison;
    });

    // 페이지네이션 적용
    const totalCount = filteredEvents.length;
    const totalPages = Math.ceil(totalCount / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const items = filteredEvents.slice(startIndex, endIndex);

    return {
      items,
      totalCount,
      page: pagination.page,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrevious: pagination.page > 1
    };
  }

  /**
   * 이벤트 타입별 조회
   */
  async getEventsByType(
    eventType: WebhookEventType,
    limit = 100
  ): Promise<WebhookEvent[]> {
    const eventIds = this.indexByType.get(eventType);
    if (!eventIds) {
      return [];
    }

    return Array.from(eventIds)
      .map(id => this.events.get(id)!)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 이벤트 통계 조회
   */
  async getEventStats(
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<WebhookEventType, number>;
    eventsByProvider: Record<string, number>;
    eventsByChannel: Record<string, number>;
    eventsPerHour: Record<string, number>;
  }> {
    const filter: EventFilter = {
      createdAfter: timeRange?.start,
      createdBefore: timeRange?.end
    };

    const result = await this.searchEvents(filter, { page: 1, limit: 10000 });
    const events = result.items;

    // 타입별 집계
    const eventsByType: Record<WebhookEventType, number> = {} as any;
    for (const eventType of Object.values(WebhookEventType)) {
      eventsByType[eventType] = 0;
    }

    // 프로바이더별 집계
    const eventsByProvider: Record<string, number> = {};
    
    // 채널별 집계
    const eventsByChannel: Record<string, number> = {};
    
    // 시간별 집계
    const eventsPerHour: Record<string, number> = {};

    for (const event of events) {
      // 타입별
      eventsByType[event.type]++;

      // 프로바이더별
      if (event.metadata.providerId) {
        eventsByProvider[event.metadata.providerId] = (eventsByProvider[event.metadata.providerId] || 0) + 1;
      }

      // 채널별
      if (event.metadata.channelId) {
        eventsByChannel[event.metadata.channelId] = (eventsByChannel[event.metadata.channelId] || 0) + 1;
      }

      // 시간별 (YYYY-MM-DD HH 형식)
      const hourKey = event.timestamp.toISOString().substring(0, 13);
      eventsPerHour[hourKey] = (eventsPerHour[hourKey] || 0) + 1;
    }

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByProvider,
      eventsByChannel,
      eventsPerHour
    };
  }

  /**
   * 오래된 이벤트 정리
   */
  async cleanupOldEvents(): Promise<number> {
    if (!this.config.retentionDays) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldEvents = Array.from(this.events.values()).filter(event => 
      event.timestamp < cutoffDate
    );

    for (const event of oldEvents) {
      this.removeFromIndexes(event);
      this.events.delete(event.id);
    }

    if (oldEvents.length > 0) {
      this.emit('oldEventsCleanup', { 
        removedCount: oldEvents.length,
        cutoffDate 
      });

      // 파일 저장
      if (this.config.type === 'file') {
        await this.saveToFile();
      }
    }

    return oldEvents.length;
  }

  /**
   * 중복 이벤트 정리
   */
  async cleanupDuplicateEvents(): Promise<number> {
    const eventsByContent = new Map<string, WebhookEvent[]>();
    
    // 이벤트를 내용별로 그룹화
    for (const event of this.events.values()) {
      const contentKey = this.generateContentKey(event);
      if (!eventsByContent.has(contentKey)) {
        eventsByContent.set(contentKey, []);
      }
      eventsByContent.get(contentKey)!.push(event);
    }

    let removedCount = 0;
    
    // 중복된 이벤트 제거 (가장 최신 것만 유지)
    for (const [contentKey, duplicateEvents] of eventsByContent.entries()) {
      if (duplicateEvents.length > 1) {
        // 타임스탬프 기준 정렬
        duplicateEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // 첫 번째(최신)를 제외한 나머지 제거
        for (let i = 1; i < duplicateEvents.length; i++) {
          const eventToRemove = duplicateEvents[i];
          this.removeFromIndexes(eventToRemove);
          this.events.delete(eventToRemove.id);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      this.emit('duplicateEventsCleanup', { removedCount });
      
      // 파일 저장
      if (this.config.type === 'file') {
        await this.saveToFile();
      }
    }

    return removedCount;
  }

  /**
   * 저장소 통계 조회
   */
  getStorageStats(): {
    totalEvents: number;
    memoryUsage: number;
    indexSizes: {
      byType: number;
      byDate: number;
      byProvider: number;
      byChannel: number;
    };
  } {
    const memoryUsage = this.estimateMemoryUsage();
    
    return {
      totalEvents: this.events.size,
      memoryUsage,
      indexSizes: {
        byType: this.indexByType.size,
        byDate: this.indexByDate.size,
        byProvider: this.indexByProvider.size,
        byChannel: this.indexByChannel.size
      }
    };
  }

  /**
   * 인덱스 초기화
   */
  private initializeIndexes(): void {
    // 이벤트 타입별 인덱스 초기화
    const eventTypes = Object.values(WebhookEventType);
    for (const eventType of eventTypes) {
      this.indexByType.set(eventType, new Set());
    }
  }

  /**
   * 인덱스에 이벤트 추가
   */
  private addToIndexes(event: WebhookEvent): void {
    // 타입 인덱스
    const typeSet = this.indexByType.get(event.type);
    if (typeSet) {
      typeSet.add(event.id);
    }

    // 날짜 인덱스
    const dateKey = event.timestamp.toISOString().split('T')[0];
    if (!this.indexByDate.has(dateKey)) {
      this.indexByDate.set(dateKey, new Set());
    }
    this.indexByDate.get(dateKey)!.add(event.id);

    // 프로바이더 인덱스
    if (event.metadata.providerId) {
      if (!this.indexByProvider.has(event.metadata.providerId)) {
        this.indexByProvider.set(event.metadata.providerId, new Set());
      }
      this.indexByProvider.get(event.metadata.providerId)!.add(event.id);
    }

    // 채널 인덱스
    if (event.metadata.channelId) {
      if (!this.indexByChannel.has(event.metadata.channelId)) {
        this.indexByChannel.set(event.metadata.channelId, new Set());
      }
      this.indexByChannel.get(event.metadata.channelId)!.add(event.id);
    }
  }

  /**
   * 인덱스에서 이벤트 제거
   */
  private removeFromIndexes(event: WebhookEvent): void {
    // 타입 인덱스
    const typeSet = this.indexByType.get(event.type);
    if (typeSet) {
      typeSet.delete(event.id);
    }

    // 날짜 인덱스
    const dateKey = event.timestamp.toISOString().split('T')[0];
    const dateSet = this.indexByDate.get(dateKey);
    if (dateSet) {
      dateSet.delete(event.id);
      if (dateSet.size === 0) {
        this.indexByDate.delete(dateKey);
      }
    }

    // 프로바이더 인덱스
    if (event.metadata.providerId) {
      const providerSet = this.indexByProvider.get(event.metadata.providerId);
      if (providerSet) {
        providerSet.delete(event.id);
        if (providerSet.size === 0) {
          this.indexByProvider.delete(event.metadata.providerId);
        }
      }
    }

    // 채널 인덱스
    if (event.metadata.channelId) {
      const channelSet = this.indexByChannel.get(event.metadata.channelId);
      if (channelSet) {
        channelSet.delete(event.id);
        if (channelSet.size === 0) {
          this.indexByChannel.delete(event.metadata.channelId);
        }
      }
    }
  }

  /**
   * 날짜 범위로 이벤트 ID 조회
   */
  private getEventIdsByDateRange(startDate?: Date, endDate?: Date): Set<string> {
    const ids = new Set<string>();
    
    for (const [dateKey, eventIds] of this.indexByDate.entries()) {
      const date = new Date(dateKey);
      
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;
      
      eventIds.forEach(id => ids.add(id));
    }
    
    return ids;
  }

  /**
   * 필터 조건 매칭 확인
   */
  private matchesFilter(event: WebhookEvent, filter: EventFilter): boolean {
    // 템플릿 ID 필터
    if (filter.templateId && filter.templateId.length > 0) {
      if (!event.metadata.templateId || !filter.templateId.includes(event.metadata.templateId)) {
        return false;
      }
    }

    // 메시지 ID 필터
    if (filter.messageId && filter.messageId.length > 0) {
      if (!event.metadata.messageId || !filter.messageId.includes(event.metadata.messageId)) {
        return false;
      }
    }

    // 사용자 ID 필터
    if (filter.userId && filter.userId.length > 0) {
      if (!event.metadata.userId || !filter.userId.includes(event.metadata.userId)) {
        return false;
      }
    }

    // 조직 ID 필터
    if (filter.organizationId && filter.organizationId.length > 0) {
      if (!event.metadata.organizationId || !filter.organizationId.includes(event.metadata.organizationId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 객체 필드 값 가져오기
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((value, key) => value?.[key], obj);
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const event of this.events.values()) {
      // 대략적인 객체 크기 계산
      totalSize += JSON.stringify(event).length * 2; // UTF-16 기준
    }
    
    return totalSize;
  }

  /**
   * 메모리 사용량 확인 및 정리
   */
  private async checkMemoryUsage(): Promise<void> {
    if (!this.config.maxMemoryUsage) return;

    const currentUsage = this.estimateMemoryUsage();
    
    if (currentUsage > this.config.maxMemoryUsage) {
      // 오래된 이벤트부터 제거
      const events = Array.from(this.events.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      let removedCount = 0;
      const targetUsage = this.config.maxMemoryUsage * 0.8; // 80%까지 줄이기
      
      for (const event of events) {
        if (this.estimateMemoryUsage() <= targetUsage) break;
        
        this.removeFromIndexes(event);
        this.events.delete(event.id);
        removedCount++;
      }
      
      if (removedCount > 0) {
        this.emit('memoryCleanup', { 
          removedCount, 
          previousUsage: currentUsage,
          currentUsage: this.estimateMemoryUsage() 
        });
      }
    }
  }

  /**
   * 이벤트 내용 키 생성 (중복 검사용)
   */
  private generateContentKey(event: WebhookEvent): string {
    return `${event.type}_${event.metadata.messageId || ''}_${event.metadata.templateId || ''}_${JSON.stringify(event.data)}`;
  }

  /**
   * 정리 작업 시작
   */
  private startCleanupTask(): void {
    // 1시간마다 정리 작업 실행
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOldEvents();
        await this.cleanupDuplicateEvents();
      } catch (error) {
        this.emit('cleanupError', error);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * 파일에 이벤트 추가
   */
  private async appendToFile(event: WebhookEvent): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const line = JSON.stringify(event) + '\n';
      await fs.appendFile(this.config.filePath, line, 'utf8');
    } catch (error) {
      this.emit('appendError', error);
    }
  }

  /**
   * 파일에서 데이터 로드
   */
  private async loadFromFile(): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const data = await fs.readFile(this.config.filePath, 'utf8');
      const lines = data.trim().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const eventData = JSON.parse(line);
          const event: WebhookEvent = {
            ...eventData,
            timestamp: new Date(eventData.timestamp)
          };
          
          this.events.set(event.id, event);
          this.addToIndexes(event);
        } catch (parseError) {
          this.emit('parseError', { line, error: parseError });
        }
      }

      this.emit('dataLoaded', { 
        filePath: this.config.filePath,
        eventCount: this.events.size 
      });

    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        this.emit('loadError', error);
      }
    }
  }

  /**
   * 파일에 데이터 저장
   */
  private async saveToFile(): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const lines = Array.from(this.events.values())
        .map(event => JSON.stringify(event))
        .join('\n');
      
      // 디렉토리 생성
      await fs.mkdir(path.dirname(this.config.filePath), { recursive: true });
      
      // 파일 저장
      await fs.writeFile(this.config.filePath, lines + '\n', 'utf8');

      this.emit('dataSaved', { 
        filePath: this.config.filePath,
        eventCount: this.events.size 
      });

    } catch (error) {
      this.emit('saveError', error);
      throw error;
    }
  }

  /**
   * 이벤트 저장소 종료
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 마지막 저장
    if (this.config.type === 'file') {
      await this.saveToFile().catch(error => {
        this.emit('saveError', error);
      });
    }

    this.emit('shutdown', { eventCount: this.events.size });
  }
}