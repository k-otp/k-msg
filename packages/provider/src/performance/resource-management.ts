/**
 * Performance and Resource Management Components
 * 성능 및 리소스 관리 컴포넌트들
 */

import { RateLimitConfig, CircuitBreakerConfig, CacheConfig, ConnectionPoolConfig } from '../config/provider-config-v2';
import { RateLimiter, CircuitBreaker, Cache, RateLimitStats, CircuitBreakerMetrics } from '../architecture/composition-provider';

// Token Bucket Rate Limiter 구현
export class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private config: RateLimitConfig) {
    this.tokens = config.burstSize;
    this.lastRefill = Date.now();
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!await this.checkLimit()) {
      throw new Error('Rate limit exceeded');
    }

    return operation();
  }

  async checkLimit(): Promise<boolean> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  getStats(): RateLimitStats {
    const now = Date.now();
    const windowDuration = 1000; // 1초 윈도우

    return {
      requestCount: this.config.burstSize - this.tokens,
      rejectedCount: 0, // 실제 구현에서는 추적 필요
      currentRate: this.config.requestsPerSecond,
      windowStart: new Date(this.lastRefill)
    };
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.config.requestsPerSecond;

    this.tokens = Math.min(this.config.burstSize, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Circuit Breaker 구현
export class DefaultCircuitBreaker implements CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private nextRetryTime?: Date;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    if (this.state === 'OPEN') {
      if (this.nextRetryTime && Date.now() < this.nextRetryTime.getTime()) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextRetryTime: this.nextRetryTime
    };
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), this.config.timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextRetryTime = new Date(Date.now() + this.config.retryDelayMs);
    }
  }
}

// LRU Cache 구현
export class LRUCache implements Cache {
  private cache = new Map<string, CacheItem>();
  private head: CacheNode;
  private tail: CacheNode;

  constructor(private config: CacheConfig) {
    // 더미 헤드와 테일 노드
    this.head = { key: '', value: null, prev: null, next: null };
    this.tail = { key: '', value: null, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // TTL 체크
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this.delete(key);
      return null;
    }

    // LRU 업데이트
    this.moveToHead(item.node);
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const expiresAt = ttl ? Date.now() + ttl : Date.now() + this.config.ttl;
    const existingItem = this.cache.get(key);

    if (existingItem) {
      // 기존 항목 업데이트
      existingItem.value = value;
      existingItem.expiresAt = expiresAt;
      this.moveToHead(existingItem.node);
    } else {
      // 새 항목 추가
      const node: CacheNode = { key, value, prev: null, next: null };
      const item: CacheItem = { value, expiresAt, node };

      this.cache.set(key, item);
      this.addToHead(node);

      // 최대 크기 초과 시 LRU 제거
      if (this.cache.size > this.config.maxSize) {
        const lru = this.removeTail();
        if (lru) {
          this.cache.delete(lru.key);
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    const item = this.cache.get(key);
    if (item) {
      this.removeNode(item.node);
      this.cache.delete(key);
    }
  }

  // LRU 더블 링크드 리스트 연산들
  private addToHead(node: CacheNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: CacheNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToHead(node: CacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): CacheNode | null {
    const lru = this.tail.prev;
    if (lru && lru !== this.head) {
      this.removeNode(lru);
      return lru;
    }
    return null;
  }
}

interface CacheItem {
  value: any;
  expiresAt: number;
  node: CacheNode;
}

interface CacheNode {
  key: string;
  value: any;
  prev: CacheNode | null;
  next: CacheNode | null;
}

// Connection Pool 구현
export class HttpConnectionPool {
  private availableConnections: HttpConnection[] = [];
  private activeConnections = new Set<HttpConnection>();
  private waitingQueue: Array<{ resolve: (conn: HttpConnection) => void; reject: (error: Error) => void }> = [];
  private isDestroyed = false;

  constructor(private config: ConnectionPoolConfig) {
    this.preCreateConnections();
  }

  async acquire(): Promise<HttpConnection> {
    if (this.isDestroyed) {
      throw new Error('Connection pool has been destroyed');
    }

    // 사용 가능한 연결이 있으면 반환
    if (this.availableConnections.length > 0) {
      const connection = this.availableConnections.pop()!;
      this.activeConnections.add(connection);
      return connection;
    }

    // 최대 연결 수에 도달하지 않았으면 새 연결 생성
    if (this.getTotalConnections() < this.config.maxConnections) {
      const connection = await this.createConnection();
      this.activeConnections.add(connection);
      return connection;
    }

    // 대기열에 추가
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.connectionTimeout);

      this.waitingQueue.push({
        resolve: (conn) => {
          clearTimeout(timeout);
          resolve(conn);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  release(connection: HttpConnection): void {
    if (!this.activeConnections.has(connection)) {
      return;
    }

    this.activeConnections.delete(connection);

    // 대기 중인 요청이 있으면 우선 처리
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      this.activeConnections.add(connection);
      waiter.resolve(connection);
      return;
    }

    // 사용 가능한 연결로 반환
    this.availableConnections.push(connection);

    // 유휴 타임아웃 설정
    setTimeout(() => {
      const index = this.availableConnections.indexOf(connection);
      if (index !== -1) {
        this.availableConnections.splice(index, 1);
        connection.close();
      }
    }, this.config.idleTimeout);
  }

  async destroy(): Promise<void> {
    this.isDestroyed = true;

    // 대기 중인 요청들 거부
    for (const waiter of this.waitingQueue) {
      waiter.reject(new Error('Connection pool destroyed'));
    }
    this.waitingQueue.length = 0;

    // 모든 연결 종료
    const allConnections = [...this.availableConnections, ...this.activeConnections];
    await Promise.allSettled(allConnections.map(conn => conn.close()));

    this.availableConnections.length = 0;
    this.activeConnections.clear();
  }

  getStats(): PoolStats {
    return {
      totalConnections: this.getTotalConnections(),
      availableConnections: this.availableConnections.length,
      activeConnections: this.activeConnections.size,
      waitingRequests: this.waitingQueue.length
    };
  }

  private getTotalConnections(): number {
    return this.availableConnections.length + this.activeConnections.size;
  }

  private async preCreateConnections(): Promise<void> {
    const minConnections = Math.min(5, this.config.maxConnections);
    const promises = Array.from({ length: minConnections }, () => this.createConnection());

    try {
      const connections = await Promise.allSettled(promises);
      connections.forEach(result => {
        if (result.status === 'fulfilled') {
          this.availableConnections.push(result.value);
        }
      });
    } catch (error) {
      console.warn('Failed to pre-create some connections:', error);
    }
  }

  private async createConnection(): Promise<HttpConnection> {
    return new HttpConnection({
      keepAlive: this.config.keepAlive,
      timeout: this.config.connectionTimeout
    });
  }
}

// HTTP Connection 구현
export class HttpConnection {
  private isConnected = false;
  private lastUsed = Date.now();

  constructor(private options: { keepAlive: boolean; timeout: number }) {}

  async request(options: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<{ status: number; data: any; headers: Record<string, string> }> {
    this.lastUsed = Date.now();

    // 실제 HTTP 요청 (Bun의 fetch 사용)
    const response = await fetch(options.url, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(this.options.timeout)
    });

    const data = await response.json();

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  }

  async close(): Promise<void> {
    this.isConnected = false;
    // 실제 연결 정리 로직
  }

  isIdle(maxIdleTime: number): boolean {
    return Date.now() - this.lastUsed > maxIdleTime;
  }
}

export interface PoolStats {
  totalConnections: number;
  availableConnections: number;
  activeConnections: number;
  waitingRequests: number;
}

// Resource Manager - 전체 리소스 관리
export class ResourceManager {
  constructor(
    private connectionPool: HttpConnectionPool,
    private cache: Cache,
    private rateLimiter: RateLimiter,
    private circuitBreaker: CircuitBreaker
  ) {}

  async healthCheck(): Promise<ResourceHealthStatus> {
    const poolStats = this.connectionPool.getStats();
    const rateLimitStats = this.rateLimiter.getStats();
    const circuitBreakerMetrics = this.circuitBreaker.getMetrics();

    return {
      connectionPool: {
        healthy: poolStats.totalConnections > 0,
        stats: poolStats
      },
      rateLimiter: {
        healthy: rateLimitStats.currentRate > 0,
        stats: rateLimitStats
      },
      circuitBreaker: {
        healthy: circuitBreakerMetrics.state !== 'OPEN',
        metrics: circuitBreakerMetrics
      },
      cache: {
        healthy: true, // 캐시는 항상 healthy로 간주
        enabled: true
      }
    };
  }

  async gracefulShutdown(timeoutMs: number = 30000): Promise<void> {
    const shutdownPromises = [
      this.connectionPool.destroy(),
      // 캐시는 메모리 기반이므로 특별한 정리 불필요
    ];

    const shutdownPromise = Promise.all(shutdownPromises);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Shutdown timeout')), timeoutMs)
    );

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      console.log('Resource manager shut down gracefully');
    } catch (error) {
      console.error('Graceful shutdown failed:', error);
      throw error;
    }
  }

  getMetrics(): ResourceMetrics {
    return {
      connectionPool: this.connectionPool.getStats(),
      rateLimiter: this.rateLimiter.getStats(),
      circuitBreaker: this.circuitBreaker.getMetrics(),
      timestamp: new Date()
    };
  }
}

export interface ResourceHealthStatus {
  connectionPool: {
    healthy: boolean;
    stats: PoolStats;
  };
  rateLimiter: {
    healthy: boolean;
    stats: RateLimitStats;
  };
  circuitBreaker: {
    healthy: boolean;
    metrics: CircuitBreakerMetrics;
  };
  cache: {
    healthy: boolean;
    enabled: boolean;
  };
}

export interface ResourceMetrics {
  connectionPool: PoolStats;
  rateLimiter: RateLimitStats;
  circuitBreaker: CircuitBreakerMetrics;
  timestamp: Date;
}