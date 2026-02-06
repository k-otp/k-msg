/**
 * Batch Webhook Dispatcher
 * 대량 웹훅 요청을 효율적으로 처리하는 배치 디스패처
 */

import type { 
  WebhookEvent, 
  WebhookEndpoint, 
  WebhookDelivery,
  WebhookBatch 
} from '../types/webhook.types';
import type { BatchConfig, DispatchJob } from './types';
import { EventEmitter } from 'events';

export class BatchDispatcher extends EventEmitter {
  private config: BatchConfig;
  private pendingJobs: Map<string, DispatchJob[]> = new Map(); // endpointId -> jobs
  private activeBatches: Map<string, WebhookBatch> = new Map();
  private batchProcessor: NodeJS.Timeout | null = null;

  private defaultConfig: BatchConfig = {
    maxBatchSize: 100,
    batchTimeoutMs: 5000,
    maxConcurrentBatches: 10,
    enablePrioritization: true,
    priorityLevels: 3
  };

  constructor(config: Partial<BatchConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };
    this.startBatchProcessor();
  }

  /**
   * 배치 작업 추가
   */
  async addJob(job: DispatchJob): Promise<void> {
    const endpointId = job.endpoint.id;
    
    if (!this.pendingJobs.has(endpointId)) {
      this.pendingJobs.set(endpointId, []);
    }
    
    const jobs = this.pendingJobs.get(endpointId)!;
    
    // 우선순위 기반 삽입
    if (this.config.enablePrioritization) {
      this.insertJobByPriority(jobs, job);
    } else {
      jobs.push(job);
    }

    // 배치 크기에 도달한 경우 즉시 처리
    if (jobs.length >= this.config.maxBatchSize) {
      await this.processBatchForEndpoint(endpointId);
    }

    this.emit('jobAdded', { endpointId, jobId: job.id, queueSize: jobs.length });
  }

  /**
   * 특정 엔드포인트의 배치 처리
   */
  async processBatchForEndpoint(endpointId: string): Promise<WebhookBatch | null> {
    const jobs = this.pendingJobs.get(endpointId);
    if (!jobs || jobs.length === 0) {
      return null;
    }

    // 동시 실행 중인 배치 수 확인
    if (this.activeBatches.size >= this.config.maxConcurrentBatches) {
      this.emit('batchSkipped', { endpointId, reason: 'max_concurrent_batches' });
      return null;
    }

    // 배치 생성
    const batchJobs = jobs.splice(0, this.config.maxBatchSize);
    const batch = this.createBatch(endpointId, batchJobs);
    
    this.activeBatches.set(batch.id, batch);
    
    try {
      this.emit('batchStarted', { batchId: batch.id, endpointId, jobCount: batchJobs.length });
      
      // 배치 실행
      await this.executeBatch(batch, batchJobs);
      
      batch.status = 'completed';
      this.emit('batchCompleted', { batchId: batch.id, endpointId, success: true });
      
    } catch (error) {
      batch.status = 'failed';
      this.emit('batchFailed', { batchId: batch.id, endpointId, error: error instanceof Error ? error.message : 'Unknown error' });
      
      // 실패한 작업을 다시 큐에 추가 (재시도를 위해)
      this.requeueFailedJobs(batchJobs);
    } finally {
      this.activeBatches.delete(batch.id);
    }

    return batch;
  }

  /**
   * 모든 대기 중인 배치 처리
   */
  async processAllBatches(): Promise<WebhookBatch[]> {
    const processedBatches: WebhookBatch[] = [];
    const endpointIds = Array.from(this.pendingJobs.keys());
    
    for (const endpointId of endpointIds) {
      const batch = await this.processBatchForEndpoint(endpointId);
      if (batch) {
        processedBatches.push(batch);
      }
    }
    
    return processedBatches;
  }

  /**
   * 배치 통계 조회
   */
  getBatchStats(): {
    pendingJobsCount: number;
    activeBatchesCount: number;
    endpointsWithPendingJobs: number;
    averageQueueSize: number;
  } {
    const endpointIds = Array.from(this.pendingJobs.keys());
    const totalPendingJobs = endpointIds.reduce((sum, id) => {
      return sum + (this.pendingJobs.get(id)?.length || 0);
    }, 0);
    
    return {
      pendingJobsCount: totalPendingJobs,
      activeBatchesCount: this.activeBatches.size,
      endpointsWithPendingJobs: endpointIds.length,
      averageQueueSize: endpointIds.length > 0 ? totalPendingJobs / endpointIds.length : 0
    };
  }

  /**
   * 특정 엔드포인트의 대기 중인 작업 수 조회
   */
  getPendingJobCount(endpointId: string): number {
    return this.pendingJobs.get(endpointId)?.length || 0;
  }

  /**
   * 배치 처리기 시작
   */
  private startBatchProcessor(): void {
    this.batchProcessor = setInterval(async () => {
      try {
        await this.processAllBatches();
      } catch (error) {
        this.emit('processorError', error);
      }
    }, this.config.batchTimeoutMs);
  }

  /**
   * 우선순위 기반 작업 삽입
   */
  private insertJobByPriority(jobs: DispatchJob[], newJob: DispatchJob): void {
    let insertIndex = 0;
    
    for (let i = 0; i < jobs.length; i++) {
      if (jobs[i].priority <= newJob.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    
    jobs.splice(insertIndex, 0, newJob);
  }

  /**
   * 배치 생성
   */
  private createBatch(endpointId: string, jobs: DispatchJob[]): WebhookBatch {
    return {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpointId,
      events: jobs.map(job => job.event),
      createdAt: new Date(),
      scheduledAt: new Date(),
      status: 'processing'
    };
  }

  /**
   * 배치 실행
   */
  private async executeBatch(batch: WebhookBatch, jobs: DispatchJob[]): Promise<void> {
    const endpoint = jobs[0]?.endpoint;
    if (!endpoint) {
      throw new Error('No endpoint found for batch');
    }

    // 병렬로 모든 작업 실행
    const deliveryPromises = jobs.map(job => this.executeJob(job));
    
    try {
      const deliveries = await Promise.allSettled(deliveryPromises);
      
      // 결과 분석
      const successful = deliveries.filter(result => result.status === 'fulfilled').length;
      const failed = deliveries.length - successful;
      
      this.emit('batchExecuted', {
        batchId: batch.id,
        endpointId: batch.endpointId,
        total: deliveries.length,
        successful,
        failed
      });
      
      if (failed > 0) {
        // 일부 실패가 있으면 에러로 처리
        throw new Error(`Batch partially failed: ${failed}/${deliveries.length} jobs failed`);
      }
      
    } catch (error) {
      this.emit('batchExecutionError', {
        batchId: batch.id,
        endpointId: batch.endpointId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 개별 작업 실행 (실제로는 WebhookDispatcher 사용)
   */
  private async executeJob(job: DispatchJob): Promise<WebhookDelivery> {
    // 이 메서드는 실제 구현에서는 WebhookDispatcher를 사용해야 함
    // 여기서는 모킹된 구현
    
    const delivery: WebhookDelivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      endpointId: job.endpoint.id,
      eventId: job.event.id,
      url: job.endpoint.url,
      httpMethod: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(job.event),
      attempts: [],
      status: 'pending',
      createdAt: new Date()
    };

    // 시뮬레이션: 90% 성공률
    const success = Math.random() > 0.1;
    
    delivery.attempts.push({
      attemptNumber: 1,
      timestamp: new Date(),
      httpStatus: success ? 200 : 500,
      responseBody: success ? 'OK' : 'Internal Server Error',
      error: success ? undefined : 'Server error',
      latencyMs: Math.floor(Math.random() * 1000) + 100
    });
    
    delivery.status = success ? 'success' : 'failed';
    delivery.completedAt = new Date();

    return delivery;
  }

  /**
   * 실패한 작업들을 다시 큐에 추가
   */
  private requeueFailedJobs(jobs: DispatchJob[]): void {
    for (const job of jobs) {
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        // 재시도 지연 시간 계산
        const baseDelay = 1000; // 1초
        const backoffMultiplier = 2;
        const delay = baseDelay * Math.pow(backoffMultiplier, job.attempts - 1);
        
        job.nextRetryAt = new Date(Date.now() + delay);
        job.scheduledAt = job.nextRetryAt;

        // 다시 큐에 추가
        setTimeout(() => {
          this.addJob(job).catch(error => {
            this.emit('requeueError', { jobId: job.id, error: error instanceof Error ? error.message : 'Unknown error' });
          });
        }, delay);
      } else {
        this.emit('jobExhausted', { jobId: job.id, endpointId: job.endpoint.id, attempts: job.attempts });
      }
    }
  }

  /**
   * 배치 처리기 정지
   */
  async shutdown(): Promise<void> {
    if (this.batchProcessor) {
      clearInterval(this.batchProcessor);
      this.batchProcessor = null;
    }

    // 활성 배치들이 완료될 때까지 대기
    const maxWaitTime = 30000; // 30초
    const startTime = Date.now();
    
    while (this.activeBatches.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.emit('shutdown', { 
      pendingJobs: this.getBatchStats().pendingJobsCount,
      activeBatches: this.activeBatches.size 
    });
  }
}