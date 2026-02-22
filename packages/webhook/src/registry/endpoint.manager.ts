/**
 * Endpoint Manager
 * 웹훅 엔드포인트 관리를 위한 고급 기능 제공
 */

import { EventEmitter } from "../shared/event-emitter";
import {
  isFileNotFoundError,
  requireFileStorageAdapter,
} from "../shared/file-storage";
import type { WebhookEndpoint } from "../types/webhook.types";
import { WebhookEventType } from "../types/webhook.types";
import type {
  EndpointFilter,
  PaginationOptions,
  SearchResult,
  StorageConfig,
} from "./types";

export class EndpointManager extends EventEmitter {
  private config: StorageConfig;
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private indexByUrl: Map<string, string> = new Map(); // url -> id
  private indexByEvent: Map<WebhookEventType, Set<string>> = new Map(); // event -> endpoint ids
  private indexByStatus: Map<string, Set<string>> = new Map(); // status -> endpoint ids

  private defaultConfig: StorageConfig = {
    type: "memory",
    retentionDays: 90,
  };

  constructor(config: Partial<StorageConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };

    this.initializeIndexes();

    if (this.config.type === "file" && this.config.filePath) {
      this.loadFromFile().catch((error) => {
        this.emit("loadError", error);
      });
    }
  }

  /**
   * 엔드포인트 추가
   */
  async addEndpoint(endpoint: WebhookEndpoint): Promise<void> {
    // 중복 URL 확인
    if (this.indexByUrl.has(endpoint.url)) {
      const existingId = this.indexByUrl.get(endpoint.url);
      if (existingId !== endpoint.id) {
        throw new Error(
          `Endpoint with URL ${endpoint.url} already exists with different ID`,
        );
      }
    }

    // 기존 엔드포인트가 있으면 인덱스에서 제거
    const existingEndpoint = this.endpoints.get(endpoint.id);
    if (existingEndpoint) {
      this.removeFromIndexes(existingEndpoint);
    }

    // 새 엔드포인트 저장
    this.endpoints.set(endpoint.id, endpoint);
    this.addToIndexes(endpoint);

    // 파일 저장
    if (this.config.type === "file") {
      await this.saveToFile();
    }

    this.emit("endpointAdded", { endpointId: endpoint.id, url: endpoint.url });
  }

  /**
   * 엔드포인트 업데이트
   */
  async updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpoint>,
  ): Promise<WebhookEndpoint> {
    const existingEndpoint = this.endpoints.get(endpointId);
    if (!existingEndpoint) {
      throw new Error(`Endpoint ${endpointId} not found`);
    }

    // URL 변경 시 중복 확인
    if (updates.url && updates.url !== existingEndpoint.url) {
      if (this.indexByUrl.has(updates.url)) {
        const existingId = this.indexByUrl.get(updates.url);
        if (existingId !== endpointId) {
          throw new Error(`Endpoint with URL ${updates.url} already exists`);
        }
      }
    }

    // 인덱스에서 제거
    this.removeFromIndexes(existingEndpoint);

    // 업데이트 적용
    const updatedEndpoint: WebhookEndpoint = {
      ...existingEndpoint,
      ...updates,
      updatedAt: new Date(),
    };

    this.endpoints.set(endpointId, updatedEndpoint);
    this.addToIndexes(updatedEndpoint);

    // 파일 저장
    if (this.config.type === "file") {
      await this.saveToFile();
    }

    this.emit("endpointUpdated", {
      endpointId,
      changes: Object.keys(updates),
      oldUrl: existingEndpoint.url,
      newUrl: updatedEndpoint.url,
    });

    return updatedEndpoint;
  }

  /**
   * 엔드포인트 제거
   */
  async removeEndpoint(endpointId: string): Promise<boolean> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return false;
    }

    // 인덱스에서 제거
    this.removeFromIndexes(endpoint);
    this.endpoints.delete(endpointId);

    // 파일 저장
    if (this.config.type === "file") {
      await this.saveToFile();
    }

    this.emit("endpointRemoved", { endpointId, url: endpoint.url });
    return true;
  }

  /**
   * 엔드포인트 조회
   */
  async getEndpoint(endpointId: string): Promise<WebhookEndpoint | null> {
    return this.endpoints.get(endpointId) || null;
  }

  /**
   * URL로 엔드포인트 조회
   */
  async getEndpointByUrl(url: string): Promise<WebhookEndpoint | null> {
    const endpointId = this.indexByUrl.get(url);
    return endpointId ? this.endpoints.get(endpointId) || null : null;
  }

  /**
   * 필터 조건에 맞는 엔드포인트 검색
   */
  async searchEndpoints(
    filter: EndpointFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 100 },
  ): Promise<SearchResult<WebhookEndpoint>> {
    let candidateIds: Set<string> | null = null;

    // 상태 필터 적용
    if (filter.status) {
      const statusIds = this.indexByStatus.get(filter.status);
      candidateIds = statusIds ? new Set(statusIds) : new Set();
    }

    // 이벤트 필터 적용
    if (filter.events && filter.events.length > 0) {
      const eventIds = new Set<string>();
      for (const eventType of filter.events) {
        const ids = this.indexByEvent.get(eventType);
        if (ids) {
          ids.forEach((id) => {
            eventIds.add(id);
          });
        }
      }

      if (candidateIds) {
        candidateIds = new Set(
          Array.from(candidateIds).filter((id) => eventIds.has(id)),
        );
      } else {
        candidateIds = eventIds;
      }
    }

    // 후보가 없으면 모든 엔드포인트를 대상으로
    if (!candidateIds) {
      candidateIds = new Set(this.endpoints.keys());
    }

    // 추가 필터 적용
    const filteredEndpoints = Array.from(candidateIds)
      .map((id) => this.endpoints.get(id)!)
      .filter((endpoint) => this.matchesFilter(endpoint, filter));

    // 정렬
    if (pagination.sortBy) {
      filteredEndpoints.sort((a, b) => {
        const aValue = this.getFieldValue(a, pagination.sortBy!);
        const bValue = this.getFieldValue(b, pagination.sortBy!);

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;

        return pagination.sortOrder === "desc" ? -comparison : comparison;
      });
    }

    // 페이지네이션 적용
    const totalCount = filteredEndpoints.length;
    const totalPages = Math.ceil(totalCount / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const items = filteredEndpoints.slice(startIndex, endIndex);

    return {
      items,
      totalCount,
      page: pagination.page,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrevious: pagination.page > 1,
    };
  }

  /**
   * 특정 이벤트 타입을 구독하는 활성 엔드포인트 조회
   */
  async getActiveEndpointsForEvent(
    eventType: WebhookEventType,
  ): Promise<WebhookEndpoint[]> {
    const endpointIds = this.indexByEvent.get(eventType);
    if (!endpointIds) {
      return [];
    }

    return Array.from(endpointIds)
      .map((id) => this.endpoints.get(id)!)
      .filter((endpoint) => endpoint.status === "active");
  }

  /**
   * 엔드포인트 통계 조회
   */
  getStats(): {
    totalEndpoints: number;
    activeEndpoints: number;
    inactiveEndpoints: number;
    errorEndpoints: number;
    suspendedEndpoints: number;
    eventSubscriptions: Record<WebhookEventType, number>;
  } {
    const total = this.endpoints.size;
    const active = this.indexByStatus.get("active")?.size || 0;
    const inactive = this.indexByStatus.get("inactive")?.size || 0;
    const error = this.indexByStatus.get("error")?.size || 0;
    const suspended = this.indexByStatus.get("suspended")?.size || 0;

    const eventSubscriptions: Record<WebhookEventType, number> = {} as any;
    for (const [eventType, endpointIds] of this.indexByEvent.entries()) {
      eventSubscriptions[eventType] = endpointIds.size;
    }

    return {
      totalEndpoints: total,
      activeEndpoints: active,
      inactiveEndpoints: inactive,
      errorEndpoints: error,
      suspendedEndpoints: suspended,
      eventSubscriptions,
    };
  }

  /**
   * 만료된 엔드포인트 정리
   */
  async cleanupExpiredEndpoints(): Promise<number> {
    if (!this.config.retentionDays) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const expiredEndpoints = Array.from(this.endpoints.values()).filter(
      (endpoint) => {
        return (
          endpoint.status === "inactive" &&
          (!endpoint.lastTriggeredAt || endpoint.lastTriggeredAt < cutoffDate)
        );
      },
    );

    for (const endpoint of expiredEndpoints) {
      await this.removeEndpoint(endpoint.id);
    }

    if (expiredEndpoints.length > 0) {
      this.emit("expiredEndpointsCleanup", {
        removedCount: expiredEndpoints.length,
        cutoffDate,
      });
    }

    return expiredEndpoints.length;
  }

  /**
   * 인덱스 초기화
   */
  private initializeIndexes(): void {
    // 이벤트 타입별 인덱스 초기화
    const eventTypes = Object.values(WebhookEventType);
    for (const eventType of eventTypes) {
      this.indexByEvent.set(eventType, new Set());
    }

    // 상태별 인덱스 초기화
    const statuses = ["active", "inactive", "error", "suspended"];
    for (const status of statuses) {
      this.indexByStatus.set(status, new Set());
    }
  }

  /**
   * 인덱스에 엔드포인트 추가
   */
  private addToIndexes(endpoint: WebhookEndpoint): void {
    // URL 인덱스
    this.indexByUrl.set(endpoint.url, endpoint.id);

    // 상태 인덱스
    const statusSet = this.indexByStatus.get(endpoint.status);
    if (statusSet) {
      statusSet.add(endpoint.id);
    }

    // 이벤트 인덱스
    for (const eventType of endpoint.events) {
      const eventSet = this.indexByEvent.get(eventType);
      if (eventSet) {
        eventSet.add(endpoint.id);
      }
    }
  }

  /**
   * 인덱스에서 엔드포인트 제거
   */
  private removeFromIndexes(endpoint: WebhookEndpoint): void {
    // URL 인덱스
    this.indexByUrl.delete(endpoint.url);

    // 상태 인덱스
    const statusSet = this.indexByStatus.get(endpoint.status);
    if (statusSet) {
      statusSet.delete(endpoint.id);
    }

    // 이벤트 인덱스
    for (const eventType of endpoint.events) {
      const eventSet = this.indexByEvent.get(eventType);
      if (eventSet) {
        eventSet.delete(endpoint.id);
      }
    }
  }

  /**
   * 필터 조건 매칭 확인
   */
  private matchesFilter(
    endpoint: WebhookEndpoint,
    filter: EndpointFilter,
  ): boolean {
    // 프로바이더 ID 필터
    if (filter.providerId && filter.providerId.length > 0) {
      const hasMatchingProvider = filter.providerId.some((providerId) =>
        endpoint.filters?.providerId?.includes(providerId),
      );
      if (!hasMatchingProvider) return false;
    }

    // 채널 ID 필터
    if (filter.channelId && filter.channelId.length > 0) {
      const hasMatchingChannel = filter.channelId.some((channelId) =>
        endpoint.filters?.channelId?.includes(channelId),
      );
      if (!hasMatchingChannel) return false;
    }

    // 생성 날짜 필터
    if (filter.createdAfter && endpoint.createdAt < filter.createdAfter) {
      return false;
    }
    if (filter.createdBefore && endpoint.createdAt > filter.createdBefore) {
      return false;
    }

    // 마지막 트리거 날짜 필터
    if (
      filter.lastTriggeredAfter &&
      (!endpoint.lastTriggeredAt ||
        endpoint.lastTriggeredAt < filter.lastTriggeredAfter)
    ) {
      return false;
    }
    if (
      filter.lastTriggeredBefore &&
      (!endpoint.lastTriggeredAt ||
        endpoint.lastTriggeredAt > filter.lastTriggeredBefore)
    ) {
      return false;
    }

    return true;
  }

  /**
   * 객체 필드 값 가져오기 (정렬용)
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    return fieldPath.split(".").reduce((value, key) => value?.[key], obj);
  }

  /**
   * 파일에서 데이터 로드
   */
  private async loadFromFile(): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const fileAdapter = requireFileStorageAdapter(this.config.fileAdapter);
      const data = await fileAdapter.readFile(this.config.filePath);
      const parsed = JSON.parse(data);

      // 엔드포인트 복원
      for (const endpointData of parsed.endpoints || []) {
        const endpoint: WebhookEndpoint = {
          ...endpointData,
          createdAt: new Date(endpointData.createdAt),
          updatedAt: new Date(endpointData.updatedAt),
          lastTriggeredAt: endpointData.lastTriggeredAt
            ? new Date(endpointData.lastTriggeredAt)
            : undefined,
        };

        this.endpoints.set(endpoint.id, endpoint);
        this.addToIndexes(endpoint);
      }

      this.emit("dataLoaded", {
        filePath: this.config.filePath,
        endpointCount: this.endpoints.size,
      });
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        this.emit("loadError", error);
      }
    }
  }

  /**
   * 파일에 데이터 저장
   */
  private async saveToFile(): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const fileAdapter = requireFileStorageAdapter(this.config.fileAdapter);
      const data = {
        endpoints: Array.from(this.endpoints.values()),
        savedAt: new Date().toISOString(),
      };

      const json = JSON.stringify(data, null, 2);

      await fileAdapter.ensureDirForFile(this.config.filePath);

      // 파일 저장
      await fileAdapter.writeFile(this.config.filePath, json);

      this.emit("dataSaved", {
        filePath: this.config.filePath,
        endpointCount: this.endpoints.size,
      });
    } catch (error) {
      this.emit("saveError", error);
      throw error;
    }
  }

  /**
   * 엔드포인트 관리자 종료
   */
  async shutdown(): Promise<void> {
    // 마지막 저장
    if (this.config.type === "file") {
      await this.saveToFile().catch((error) => {
        this.emit("saveError", error);
      });
    }

    this.emit("shutdown", { endpointCount: this.endpoints.size });
  }
}
