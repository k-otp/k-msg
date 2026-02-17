/**
 * Queue Manager
 * 웹훅 작업 큐 관리 시스템
 */

import {
  isFileNotFoundError,
  requireFileStorageAdapter,
  resolveStoragePath,
} from "../shared/file-storage";
import { EventEmitter } from "../shared/event-emitter";
import type { DispatchJob, QueueConfig } from "./types";

export class QueueManager extends EventEmitter {
  private config: QueueConfig;
  private queues: Map<string, DispatchJob[]> = new Map(); // priority level -> jobs
  private highPriorityQueue: DispatchJob[] = [];
  private mediumPriorityQueue: DispatchJob[] = [];
  private lowPriorityQueue: DispatchJob[] = [];
  private delayedJobs: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private ttlCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private totalJobs = 0;

  private defaultConfig: QueueConfig = {
    maxQueueSize: 10000,
    persistToDisk: false,
    compressionEnabled: false,
    ttlMs: 24 * 60 * 60 * 1000, // 24시간
  };

  constructor(config: Partial<QueueConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };

    // 우선순위 큐 초기화
    this.queues.set("high", this.highPriorityQueue);
    this.queues.set("medium", this.mediumPriorityQueue);
    this.queues.set("low", this.lowPriorityQueue);

    if (this.config.persistToDisk && this.config.diskPath) {
      this.loadFromDisk().catch((error) => {
        this.emit("diskLoadError", error);
      });
    }

    // TTL 정리 작업 시작
    this.startTTLCleanup();
  }

  /**
   * 작업을 큐에 추가
   */
  async enqueue(job: DispatchJob): Promise<boolean> {
    // 큐 크기 제한 확인
    if (this.totalJobs >= this.config.maxQueueSize) {
      this.emit("queueFull", {
        totalJobs: this.totalJobs,
        maxSize: this.config.maxQueueSize,
      });
      return false;
    }

    // 스케줄된 시간이 미래인 경우 지연 처리
    if (job.scheduledAt > new Date()) {
      await this.scheduleDelayedJob(job);
      return true;
    }

    // 우선순위에 따른 큐 선택
    const queueName = this.getQueueName(job.priority);
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }

    // 큐에 추가
    queue.push(job);
    this.totalJobs++;

    this.emit("jobEnqueued", {
      jobId: job.id,
      priority: job.priority,
      queueName,
      totalJobs: this.totalJobs,
    });

    // 디스크 영속화
    if (this.config.persistToDisk) {
      await this.saveToDisk().catch((error) => {
        this.emit("diskSaveError", error);
      });
    }

    return true;
  }

  /**
   * 우선순위에 따라 작업 추출
   */
  async dequeue(): Promise<DispatchJob | null> {
    // 높은 우선순위부터 확인
    for (const [queueName, queue] of this.queues.entries()) {
      if (queue.length > 0) {
        const job = queue.shift()!;
        this.totalJobs--;

        this.emit("jobDequeued", {
          jobId: job.id,
          queueName,
          totalJobs: this.totalJobs,
        });

        // 디스크 영속화
        if (this.config.persistToDisk) {
          await this.saveToDisk().catch((error) => {
            this.emit("diskSaveError", error);
          });
        }

        return job;
      }
    }

    return null;
  }

  /**
   * 특정 우선순위 큐에서 작업 추출
   */
  async dequeueFromPriority(priority: number): Promise<DispatchJob | null> {
    const queueName = this.getQueueName(priority);
    const queue = this.queues.get(queueName);

    if (!queue || queue.length === 0) {
      return null;
    }

    const job = queue.shift()!;
    this.totalJobs--;

    this.emit("jobDequeued", {
      jobId: job.id,
      queueName,
      totalJobs: this.totalJobs,
    });

    return job;
  }

  /**
   * 작업 상태 확인
   */
  peek(): DispatchJob | null {
    for (const queue of this.queues.values()) {
      if (queue.length > 0) {
        return queue[0];
      }
    }
    return null;
  }

  /**
   * 특정 작업 제거
   */
  async removeJob(jobId: string): Promise<boolean> {
    for (const [queueName, queue] of this.queues.entries()) {
      const index = queue.findIndex((job) => job.id === jobId);
      if (index !== -1) {
        queue.splice(index, 1);
        this.totalJobs--;

        this.emit("jobRemoved", {
          jobId,
          queueName,
          totalJobs: this.totalJobs,
        });

        // 디스크 영속화
        if (this.config.persistToDisk) {
          await this.saveToDisk().catch((error) => {
            this.emit("diskSaveError", error);
          });
        }

        return true;
      }
    }

    // 지연된 작업에서도 확인
    const delayedTimeout = this.delayedJobs.get(jobId);
    if (delayedTimeout) {
      clearTimeout(delayedTimeout);
      this.delayedJobs.delete(jobId);
      this.emit("delayedJobCanceled", { jobId });
      return true;
    }

    return false;
  }

  /**
   * 큐 통계 조회
   */
  getStats(): {
    totalJobs: number;
    highPriorityJobs: number;
    mediumPriorityJobs: number;
    lowPriorityJobs: number;
    delayedJobs: number;
    queueUtilization: number;
  } {
    return {
      totalJobs: this.totalJobs,
      highPriorityJobs: this.highPriorityQueue.length,
      mediumPriorityJobs: this.mediumPriorityQueue.length,
      lowPriorityJobs: this.lowPriorityQueue.length,
      delayedJobs: this.delayedJobs.size,
      queueUtilization: (this.totalJobs / this.config.maxQueueSize) * 100,
    };
  }

  /**
   * 큐 비우기
   */
  async clear(): Promise<void> {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }

    // 지연된 작업들 취소
    for (const timeout of this.delayedJobs.values()) {
      clearTimeout(timeout);
    }
    this.delayedJobs.clear();

    this.totalJobs = 0;

    this.emit("queueCleared");

    // 디스크에서도 삭제
    if (this.config.persistToDisk) {
      await this.saveToDisk().catch((error) => {
        this.emit("diskSaveError", error);
      });
    }
  }

  /**
   * 만료된 작업 정리
   */
  async cleanupExpiredJobs(): Promise<number> {
    const now = new Date();
    let removedCount = 0;

    for (const [queueName, queue] of this.queues.entries()) {
      // TTL 확인하여 만료된 작업 제거
      for (let i = queue.length - 1; i >= 0; i--) {
        const job = queue[i];
        const age = now.getTime() - job.createdAt.getTime();

        if (age > this.config.ttlMs) {
          queue.splice(i, 1);
          this.totalJobs--;
          removedCount++;

          this.emit("jobExpired", {
            jobId: job.id,
            queueName,
            age,
          });
        }
      }
    }

    if (removedCount > 0) {
      this.emit("expiredJobsCleanup", {
        removedCount,
        totalJobs: this.totalJobs,
      });

      // 디스크 영속화
      if (this.config.persistToDisk) {
        await this.saveToDisk().catch((error) => {
          this.emit("diskSaveError", error);
        });
      }
    }

    return removedCount;
  }

  /**
   * 우선순위 숫자를 큐 이름으로 변환
   */
  private getQueueName(priority: number): string {
    if (priority >= 8) return "high";
    if (priority >= 5) return "medium";
    return "low";
  }

  /**
   * 지연된 작업 스케줄링
   */
  private async scheduleDelayedJob(job: DispatchJob): Promise<void> {
    const delay = job.scheduledAt.getTime() - Date.now();

    const timeout = setTimeout(async () => {
      this.delayedJobs.delete(job.id);

      // 정시가 되면 큐에 추가
      const success = await this.enqueue({
        ...job,
        scheduledAt: new Date(), // 즉시 처리 가능하도록 변경
      });

      if (success) {
        this.emit("delayedJobActivated", { jobId: job.id });
      }
    }, delay);

    this.delayedJobs.set(job.id, timeout);

    this.emit("jobScheduled", {
      jobId: job.id,
      scheduledAt: job.scheduledAt,
      delay,
    });
  }

  /**
   * TTL 정리 작업 시작
   */
  private startTTLCleanup(): void {
    if (this.ttlCleanupInterval) {
      clearInterval(this.ttlCleanupInterval);
    }

    // 5분마다 만료된 작업 정리
    this.ttlCleanupInterval = setInterval(
      async () => {
        try {
          await this.cleanupExpiredJobs();
        } catch (error) {
          this.emit("cleanupError", error);
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * 디스크에 큐 상태 저장
   */
  private async saveToDisk(): Promise<void> {
    if (!this.config.diskPath) return;

    try {
      const fileAdapter = requireFileStorageAdapter(this.config.fileAdapter);
      const data = {
        queues: {
          high: this.highPriorityQueue,
          medium: this.mediumPriorityQueue,
          low: this.lowPriorityQueue,
        },
        totalJobs: this.totalJobs,
        timestamp: new Date().toISOString(),
      };

      const json = JSON.stringify(data, null, 2);
      const filePath = resolveStoragePath(this.config.diskPath, "webhook-queue.json");
      await fileAdapter.ensureDirForFile(filePath);

      // 파일 저장
      await fileAdapter.writeFile(filePath, json);

      this.emit("diskSaved", { filePath, totalJobs: this.totalJobs });
    } catch (error) {
      this.emit("diskSaveError", error);
      throw error;
    }
  }

  /**
   * 디스크에서 큐 상태 로드
   */
  private async loadFromDisk(): Promise<void> {
    if (!this.config.diskPath) return;

    try {
      const fileAdapter = requireFileStorageAdapter(this.config.fileAdapter);
      const filePath = resolveStoragePath(this.config.diskPath, "webhook-queue.json");
      const json = await fileAdapter.readFile(filePath);
      const data = JSON.parse(json);

      // 큐 복원
      this.highPriorityQueue.length = 0;
      this.mediumPriorityQueue.length = 0;
      this.lowPriorityQueue.length = 0;

      this.highPriorityQueue.push(...(data.queues.high || []));
      this.mediumPriorityQueue.push(...(data.queues.medium || []));
      this.lowPriorityQueue.push(...(data.queues.low || []));

      this.totalJobs = data.totalJobs || 0;

      this.emit("diskLoaded", {
        filePath,
        totalJobs: this.totalJobs,
        timestamp: data.timestamp,
      });
    } catch (error) {
      if (!isFileNotFoundError(error)) {
        this.emit("diskLoadError", error);
      }
      // 파일이 없는 경우는 정상 (처음 시작)
    }
  }

  /**
   * 큐 관리자 종료
   */
  async shutdown(): Promise<void> {
    if (this.ttlCleanupInterval) {
      clearInterval(this.ttlCleanupInterval);
      this.ttlCleanupInterval = null;
    }

    // 지연된 작업들 취소
    for (const timeout of this.delayedJobs.values()) {
      clearTimeout(timeout);
    }
    this.delayedJobs.clear();

    // 마지막 디스크 저장
    if (this.config.persistToDisk) {
      await this.saveToDisk().catch((error) => {
        this.emit("diskSaveError", error);
      });
    }

    this.emit("shutdown", { totalJobs: this.totalJobs });
  }
}
