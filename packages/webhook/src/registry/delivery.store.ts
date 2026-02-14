/**
 * Delivery Store
 * 웹훅 전달 기록 저장 및 관리
 */

import { EventEmitter } from "events";
import * as fs from "fs/promises";
import * as path from "path";
import type { WebhookDelivery, WebhookEventType } from "../types/webhook.types";
import type {
  DeliveryFilter,
  PaginationOptions,
  SearchResult,
  StorageConfig,
} from "./types";

export class DeliveryStore extends EventEmitter {
  private config: StorageConfig;
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private indexByEndpoint: Map<string, Set<string>> = new Map(); // endpointId -> delivery ids
  private indexByStatus: Map<string, Set<string>> = new Map(); // status -> delivery ids
  private indexByDate: Map<string, Set<string>> = new Map(); // YYYY-MM-DD -> delivery ids
  private cleanupInterval: NodeJS.Timeout | null = null;

  private defaultConfig: StorageConfig = {
    type: "memory",
    retentionDays: 30,
    enableCompression: false,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  };

  constructor(config: Partial<StorageConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };

    this.initializeIndexes();
    this.startCleanupTask();

    if (this.config.type === "file" && this.config.filePath) {
      this.loadFromFile().catch((error) => {
        this.emit("loadError", error);
      });
    }
  }

  /**
   * 전달 기록 저장
   */
  async saveDelivery(delivery: WebhookDelivery): Promise<void> {
    // 기존 기록이 있으면 인덱스에서 제거
    const existingDelivery = this.deliveries.get(delivery.id);
    if (existingDelivery) {
      this.removeFromIndexes(existingDelivery);
    }

    // 메모리 사용량 확인
    if (this.config.type === "memory" && this.config.maxMemoryUsage) {
      await this.checkMemoryUsage();
    }

    // 새 기록 저장
    this.deliveries.set(delivery.id, delivery);
    this.addToIndexes(delivery);

    // 파일 저장
    if (this.config.type === "file") {
      await this.appendToFile(delivery);
    }

    this.emit("deliverySaved", {
      deliveryId: delivery.id,
      endpointId: delivery.endpointId,
      status: delivery.status,
    });
  }

  /**
   * 전달 기록 조회
   */
  async getDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    return this.deliveries.get(deliveryId) || null;
  }

  /**
   * 필터 조건에 맞는 전달 기록 검색
   */
  async searchDeliveries(
    filter: DeliveryFilter = {},
    pagination: PaginationOptions = { page: 1, limit: 100 },
  ): Promise<SearchResult<WebhookDelivery>> {
    let candidateIds: Set<string> | null = null;

    // 엔드포인트 필터 적용
    if (filter.endpointId) {
      const endpointIds = this.indexByEndpoint.get(filter.endpointId);
      candidateIds = endpointIds ? new Set(endpointIds) : new Set();
    }

    // 상태 필터 적용
    if (filter.status) {
      const statusIds = this.indexByStatus.get(filter.status);
      if (candidateIds) {
        candidateIds = new Set(
          Array.from(candidateIds).filter((id) => statusIds?.has(id)),
        );
      } else {
        candidateIds = statusIds ? new Set(statusIds) : new Set();
      }
    }

    // 날짜 범위 필터 적용
    if (filter.createdAfter || filter.createdBefore) {
      const dateIds = this.getDeliveryIdsByDateRange(
        filter.createdAfter,
        filter.createdBefore,
      );
      if (candidateIds) {
        candidateIds = new Set(
          Array.from(candidateIds).filter((id) => dateIds.has(id)),
        );
      } else {
        candidateIds = dateIds;
      }
    }

    // 후보가 없으면 모든 전달 기록을 대상으로
    if (!candidateIds) {
      candidateIds = new Set(this.deliveries.keys());
    }

    // 추가 필터 적용
    const filteredDeliveries = Array.from(candidateIds)
      .map((id) => this.deliveries.get(id)!)
      .filter((delivery) => this.matchesFilter(delivery, filter));

    // 정렬 (기본: 최신순)
    filteredDeliveries.sort((a, b) => {
      if (pagination.sortBy === "createdAt" || !pagination.sortBy) {
        const comparison = b.createdAt.getTime() - a.createdAt.getTime();
        return pagination.sortOrder === "asc" ? -comparison : comparison;
      }

      const aValue = this.getFieldValue(a, pagination.sortBy);
      const bValue = this.getFieldValue(b, pagination.sortBy);

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      return pagination.sortOrder === "desc" ? -comparison : comparison;
    });

    // 페이지네이션 적용
    const totalCount = filteredDeliveries.length;
    const totalPages = Math.ceil(totalCount / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const items = filteredDeliveries.slice(startIndex, endIndex);

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
   * 엔드포인트별 전달 기록 조회
   */
  async getDeliveriesByEndpoint(
    endpointId: string,
    limit = 100,
  ): Promise<WebhookDelivery[]> {
    const deliveryIds = this.indexByEndpoint.get(endpointId);
    if (!deliveryIds) {
      return [];
    }

    return Array.from(deliveryIds)
      .map((id) => this.deliveries.get(id)!)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * 실패한 전달 기록 조회
   */
  async getFailedDeliveries(
    endpointId?: string,
    limit = 100,
  ): Promise<WebhookDelivery[]> {
    const filter: DeliveryFilter = {
      status: "failed",
      endpointId,
    };

    const result = await this.searchDeliveries(filter, { page: 1, limit });
    return result.items;
  }

  /**
   * 전달 통계 조회
   */
  async getDeliveryStats(
    endpointId?: string,
    timeRange?: { start: Date; end: Date },
  ): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingDeliveries: number;
    exhaustedDeliveries: number;
    averageLatency: number;
    successRate: number;
    errorBreakdown: Record<string, number>;
  }> {
    const filter: DeliveryFilter = {
      endpointId,
      createdAfter: timeRange?.start,
      createdBefore: timeRange?.end,
    };

    const result = await this.searchDeliveries(filter, {
      page: 1,
      limit: 10000,
    });
    const deliveries = result.items;

    const successful = deliveries.filter((d) => d.status === "success");
    const failed = deliveries.filter((d) => d.status === "failed");
    const pending = deliveries.filter((d) => d.status === "pending");
    const exhausted = deliveries.filter((d) => d.status === "exhausted");

    // 평균 레이턴시 계산
    const completedDeliveries = deliveries.filter((d) => d.completedAt);
    const totalLatency = completedDeliveries.reduce((sum, delivery) => {
      const lastAttempt = delivery.attempts[delivery.attempts.length - 1];
      return sum + (lastAttempt?.latencyMs || 0);
    }, 0);
    const averageLatency =
      completedDeliveries.length > 0
        ? totalLatency / completedDeliveries.length
        : 0;

    // 에러 유형별 분석
    const errorBreakdown: Record<string, number> = {};
    for (const delivery of [...failed, ...exhausted]) {
      const lastAttempt = delivery.attempts[delivery.attempts.length - 1];
      if (lastAttempt?.error) {
        errorBreakdown[lastAttempt.error] =
          (errorBreakdown[lastAttempt.error] || 0) + 1;
      } else if (lastAttempt?.httpStatus) {
        const errorKey = `HTTP ${lastAttempt.httpStatus}`;
        errorBreakdown[errorKey] = (errorBreakdown[errorKey] || 0) + 1;
      }
    }

    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: successful.length,
      failedDeliveries: failed.length,
      pendingDeliveries: pending.length,
      exhaustedDeliveries: exhausted.length,
      averageLatency,
      successRate:
        deliveries.length > 0
          ? (successful.length / deliveries.length) * 100
          : 0,
      errorBreakdown,
    };
  }

  /**
   * 오래된 전달 기록 정리
   */
  async cleanupOldDeliveries(): Promise<number> {
    if (!this.config.retentionDays) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldDeliveries = Array.from(this.deliveries.values()).filter(
      (delivery) => delivery.createdAt < cutoffDate,
    );

    for (const delivery of oldDeliveries) {
      this.removeFromIndexes(delivery);
      this.deliveries.delete(delivery.id);
    }

    if (oldDeliveries.length > 0) {
      this.emit("oldDeliveriesCleanup", {
        removedCount: oldDeliveries.length,
        cutoffDate,
      });

      // 파일 저장
      if (this.config.type === "file") {
        await this.saveToFile();
      }
    }

    return oldDeliveries.length;
  }

  /**
   * 저장소 통계 조회
   */
  getStorageStats(): {
    totalDeliveries: number;
    memoryUsage: number;
    indexSizes: {
      byEndpoint: number;
      byStatus: number;
      byDate: number;
    };
  } {
    const memoryUsage = this.estimateMemoryUsage();

    return {
      totalDeliveries: this.deliveries.size,
      memoryUsage,
      indexSizes: {
        byEndpoint: this.indexByEndpoint.size,
        byStatus: this.indexByStatus.size,
        byDate: this.indexByDate.size,
      },
    };
  }

  /**
   * 인덱스 초기화
   */
  private initializeIndexes(): void {
    const statuses = ["pending", "success", "failed", "exhausted"];
    for (const status of statuses) {
      this.indexByStatus.set(status, new Set());
    }
  }

  /**
   * 인덱스에 전달 기록 추가
   */
  private addToIndexes(delivery: WebhookDelivery): void {
    // 엔드포인트 인덱스
    if (!this.indexByEndpoint.has(delivery.endpointId)) {
      this.indexByEndpoint.set(delivery.endpointId, new Set());
    }
    this.indexByEndpoint.get(delivery.endpointId)!.add(delivery.id);

    // 상태 인덱스
    const statusSet = this.indexByStatus.get(delivery.status);
    if (statusSet) {
      statusSet.add(delivery.id);
    }

    // 날짜 인덱스
    const dateKey = delivery.createdAt.toISOString().split("T")[0];
    if (!this.indexByDate.has(dateKey)) {
      this.indexByDate.set(dateKey, new Set());
    }
    this.indexByDate.get(dateKey)!.add(delivery.id);
  }

  /**
   * 인덱스에서 전달 기록 제거
   */
  private removeFromIndexes(delivery: WebhookDelivery): void {
    // 엔드포인트 인덱스
    const endpointSet = this.indexByEndpoint.get(delivery.endpointId);
    if (endpointSet) {
      endpointSet.delete(delivery.id);
      if (endpointSet.size === 0) {
        this.indexByEndpoint.delete(delivery.endpointId);
      }
    }

    // 상태 인덱스
    const statusSet = this.indexByStatus.get(delivery.status);
    if (statusSet) {
      statusSet.delete(delivery.id);
    }

    // 날짜 인덱스
    const dateKey = delivery.createdAt.toISOString().split("T")[0];
    const dateSet = this.indexByDate.get(dateKey);
    if (dateSet) {
      dateSet.delete(delivery.id);
      if (dateSet.size === 0) {
        this.indexByDate.delete(dateKey);
      }
    }
  }

  /**
   * 날짜 범위로 전달 기록 ID 조회
   */
  private getDeliveryIdsByDateRange(
    startDate?: Date,
    endDate?: Date,
  ): Set<string> {
    const ids = new Set<string>();

    for (const [dateKey, deliveryIds] of this.indexByDate.entries()) {
      const date = new Date(dateKey);

      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      deliveryIds.forEach((id) => {
        ids.add(id);
      });
    }

    return ids;
  }

  /**
   * 필터 조건 매칭 확인
   */
  private matchesFilter(
    delivery: WebhookDelivery,
    filter: DeliveryFilter,
  ): boolean {
    // 이벤트 ID 필터
    if (filter.eventId && delivery.eventId !== filter.eventId) {
      return false;
    }

    // HTTP 상태 코드 필터
    if (filter.httpStatusCode && filter.httpStatusCode.length > 0) {
      const lastAttempt = delivery.attempts[delivery.attempts.length - 1];
      if (
        !lastAttempt?.httpStatus ||
        !filter.httpStatusCode.includes(lastAttempt.httpStatus)
      ) {
        return false;
      }
    }

    // 에러 존재 여부 필터
    if (filter.hasError !== undefined) {
      const hasError = delivery.attempts.some((attempt) => attempt.error);
      if (filter.hasError !== hasError) {
        return false;
      }
    }

    // 완료 날짜 필터
    if (
      filter.completedAfter &&
      (!delivery.completedAt || delivery.completedAt < filter.completedAfter)
    ) {
      return false;
    }
    if (
      filter.completedBefore &&
      (!delivery.completedAt || delivery.completedAt > filter.completedBefore)
    ) {
      return false;
    }

    return true;
  }

  /**
   * 객체 필드 값 가져오기
   */
  private getFieldValue(obj: any, fieldPath: string): any {
    return fieldPath.split(".").reduce((value, key) => value?.[key], obj);
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const delivery of this.deliveries.values()) {
      // 대략적인 객체 크기 계산
      totalSize += JSON.stringify(delivery).length * 2; // UTF-16 기준
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
      // 오래된 전달 기록부터 제거
      const deliveries = Array.from(this.deliveries.values()).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );

      let removedCount = 0;
      const targetUsage = this.config.maxMemoryUsage * 0.8; // 80%까지 줄이기

      for (const delivery of deliveries) {
        if (this.estimateMemoryUsage() <= targetUsage) break;

        this.removeFromIndexes(delivery);
        this.deliveries.delete(delivery.id);
        removedCount++;
      }

      if (removedCount > 0) {
        this.emit("memoryCleanup", {
          removedCount,
          previousUsage: currentUsage,
          currentUsage: this.estimateMemoryUsage(),
        });
      }
    }
  }

  /**
   * 정리 작업 시작
   */
  private startCleanupTask(): void {
    // 1시간마다 정리 작업 실행
    this.cleanupInterval = setInterval(
      async () => {
        try {
          await this.cleanupOldDeliveries();
          await this.checkMemoryUsage();
        } catch (error) {
          this.emit("cleanupError", error);
        }
      },
      60 * 60 * 1000,
    );
  }

  /**
   * 파일에 전달 기록 추가
   */
  private async appendToFile(delivery: WebhookDelivery): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const line = JSON.stringify(delivery) + "\n";
      await fs.appendFile(this.config.filePath, line, "utf8");
    } catch (error) {
      this.emit("appendError", error);
    }
  }

  /**
   * 파일에서 데이터 로드
   */
  private async loadFromFile(): Promise<void> {
    if (!this.config.filePath) return;

    try {
      const data = await fs.readFile(this.config.filePath, "utf8");
      const lines = data
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      for (const line of lines) {
        try {
          const deliveryData = JSON.parse(line);
          const delivery: WebhookDelivery = {
            ...deliveryData,
            createdAt: new Date(deliveryData.createdAt),
            completedAt: deliveryData.completedAt
              ? new Date(deliveryData.completedAt)
              : undefined,
            nextRetryAt: deliveryData.nextRetryAt
              ? new Date(deliveryData.nextRetryAt)
              : undefined,
            attempts: deliveryData.attempts.map((attempt: any) => ({
              ...attempt,
              timestamp: new Date(attempt.timestamp),
            })),
          };

          this.deliveries.set(delivery.id, delivery);
          this.addToIndexes(delivery);
        } catch (parseError) {
          this.emit("parseError", { line, error: parseError });
        }
      }

      this.emit("dataLoaded", {
        filePath: this.config.filePath,
        deliveryCount: this.deliveries.size,
      });
    } catch (error) {
      if ((error as any).code !== "ENOENT") {
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
      const lines = Array.from(this.deliveries.values())
        .map((delivery) => JSON.stringify(delivery))
        .join("\n");

      // 디렉토리 생성
      await fs.mkdir(path.dirname(this.config.filePath), { recursive: true });

      // 파일 저장
      await fs.writeFile(this.config.filePath, lines + "\n", "utf8");

      this.emit("dataSaved", {
        filePath: this.config.filePath,
        deliveryCount: this.deliveries.size,
      });
    } catch (error) {
      this.emit("saveError", error);
      throw error;
    }
  }

  /**
   * 전달 저장소 종료
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 마지막 저장
    if (this.config.type === "file") {
      await this.saveToFile().catch((error) => {
        this.emit("saveError", error);
      });
    }

    this.emit("shutdown", { deliveryCount: this.deliveries.size });
  }
}
