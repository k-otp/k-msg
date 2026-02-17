/**
 * Load Balancer
 * 웹훅 엔드포인트 간의 부하 분산 관리
 */

import { EventEmitter } from "../shared/event-emitter";
import type { WebhookEndpoint } from "../types/webhook.types";
import type { CircuitBreakerState, LoadBalancerConfig } from "./types";

interface EndpointHealth {
  endpointId: string;
  isHealthy: boolean;
  consecutiveFailures: number;
  lastHealthCheckAt: Date;
  averageResponseTime: number;
  activeConnections: number;
}

export class LoadBalancer extends EventEmitter {
  private config: LoadBalancerConfig;
  private endpointHealth: Map<string, EndpointHealth> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private connectionCounts: Map<string, number> = new Map();
  private roundRobinIndex = 0;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;

  private defaultConfig: LoadBalancerConfig = {
    strategy: "round-robin",
    healthCheckInterval: 30000, // 30초
    healthCheckTimeoutMs: 5000,
    weights: {},
  };

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    super();
    this.config = { ...this.defaultConfig, ...config };

    this.startHealthChecks();
  }

  /**
   * 엔드포인트 등록
   */
  async registerEndpoint(endpoint: WebhookEndpoint): Promise<void> {
    const health: EndpointHealth = {
      endpointId: endpoint.id,
      isHealthy: true,
      consecutiveFailures: 0,
      lastHealthCheckAt: new Date(),
      averageResponseTime: 0,
      activeConnections: 0,
    };

    this.endpointHealth.set(endpoint.id, health);
    this.connectionCounts.set(endpoint.id, 0);

    // 초기 건강 상태 확인
    await this.checkEndpointHealth(endpoint);

    this.emit("endpointRegistered", {
      endpointId: endpoint.id,
      isHealthy: health.isHealthy,
    });
  }

  /**
   * 엔드포인트 등록 해제
   */
  async unregisterEndpoint(endpointId: string): Promise<void> {
    this.endpointHealth.delete(endpointId);
    this.circuitBreakers.delete(endpointId);
    this.connectionCounts.delete(endpointId);

    this.emit("endpointUnregistered", { endpointId });
  }

  /**
   * 로드 밸런싱을 통한 엔드포인트 선택
   */
  async selectEndpoint(
    endpoints: WebhookEndpoint[],
  ): Promise<WebhookEndpoint | null> {
    const healthyEndpoints = endpoints.filter((endpoint) => {
      const health = this.endpointHealth.get(endpoint.id);
      const circuitBreaker = this.circuitBreakers.get(endpoint.id);

      return (
        health?.isHealthy &&
        endpoint.status === "active" &&
        circuitBreaker?.state !== "open"
      );
    });

    if (healthyEndpoints.length === 0) {
      // 모든 엔드포인트가 비정상인 경우 Circuit Breaker half-open 시도
      const halfOpenEndpoint = this.tryHalfOpenEndpoint(endpoints);
      if (halfOpenEndpoint) {
        return halfOpenEndpoint;
      }

      this.emit("noHealthyEndpoints", { totalEndpoints: endpoints.length });
      return null;
    }

    let selectedEndpoint: WebhookEndpoint;

    switch (this.config.strategy) {
      case "round-robin":
        selectedEndpoint = this.selectRoundRobin(healthyEndpoints);
        break;

      case "least-connections":
        selectedEndpoint = this.selectLeastConnections(healthyEndpoints);
        break;

      case "weighted":
        selectedEndpoint = this.selectWeighted(healthyEndpoints);
        break;

      case "random":
        selectedEndpoint = this.selectRandom(healthyEndpoints);
        break;

      default:
        selectedEndpoint = healthyEndpoints[0];
    }

    // 연결 수 증가
    this.incrementConnections(selectedEndpoint.id);

    this.emit("endpointSelected", {
      endpointId: selectedEndpoint.id,
      strategy: this.config.strategy,
      availableEndpoints: healthyEndpoints.length,
    });

    return selectedEndpoint;
  }

  /**
   * 요청 완료 시 호출 (연결 수 감소 및 통계 업데이트)
   */
  async onRequestComplete(
    endpointId: string,
    success: boolean,
    responseTime: number,
  ): Promise<void> {
    // 연결 수 감소
    this.decrementConnections(endpointId);

    // 건강 상태 업데이트
    const health = this.endpointHealth.get(endpointId);
    if (health) {
      // 평균 응답 시간 업데이트
      if (health.averageResponseTime === 0) {
        health.averageResponseTime = responseTime;
      } else {
        health.averageResponseTime =
          health.averageResponseTime * 0.8 + responseTime * 0.2;
      }

      if (success) {
        health.consecutiveFailures = 0;
        health.isHealthy = true;

        // Circuit Breaker 복구
        const circuitBreaker = this.circuitBreakers.get(endpointId);
        if (circuitBreaker) {
          if (circuitBreaker.state === "half-open") {
            circuitBreaker.state = "closed";
            circuitBreaker.failureCount = 0;
            this.emit("circuitBreakerClosed", { endpointId });
          }
        }
      } else {
        health.consecutiveFailures++;

        // 3번 연속 실패 시 비정상으로 마킹
        if (health.consecutiveFailures >= 3) {
          health.isHealthy = false;
          this.emit("endpointUnhealthy", {
            endpointId,
            consecutiveFailures: health.consecutiveFailures,
          });
        }

        // Circuit Breaker 업데이트
        this.updateCircuitBreaker(endpointId, false);
      }
    }

    this.emit("requestCompleted", {
      endpointId,
      success,
      responseTime,
      averageResponseTime: health?.averageResponseTime,
    });
  }

  /**
   * 엔드포인트 건강 상태 조회
   */
  getEndpointHealth(endpointId: string): EndpointHealth | null {
    return this.endpointHealth.get(endpointId) || null;
  }

  /**
   * 모든 엔드포인트 건강 상태 조회
   */
  getAllEndpointHealth(): EndpointHealth[] {
    return Array.from(this.endpointHealth.values());
  }

  /**
   * 로드 밸런서 통계 조회
   */
  getStats(): {
    totalEndpoints: number;
    healthyEndpoints: number;
    activeConnections: number;
    circuitBreakersOpen: number;
    averageResponseTime: number;
  } {
    const healths = Array.from(this.endpointHealth.values());
    const totalConnections = Array.from(this.connectionCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const circuitBreakersOpen = Array.from(
      this.circuitBreakers.values(),
    ).filter((cb) => cb.state === "open").length;
    const avgResponseTime =
      healths.length > 0
        ? healths.reduce((sum, h) => sum + h.averageResponseTime, 0) /
          healths.length
        : 0;

    return {
      totalEndpoints: healths.length,
      healthyEndpoints: healths.filter((h) => h.isHealthy).length,
      activeConnections: totalConnections,
      circuitBreakersOpen,
      averageResponseTime: avgResponseTime,
    };
  }

  /**
   * Round Robin 전략
   */
  private selectRoundRobin(endpoints: WebhookEndpoint[]): WebhookEndpoint {
    const endpoint = endpoints[this.roundRobinIndex % endpoints.length];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % endpoints.length;
    return endpoint;
  }

  /**
   * Least Connections 전략
   */
  private selectLeastConnections(
    endpoints: WebhookEndpoint[],
  ): WebhookEndpoint {
    return endpoints.reduce((least, current) => {
      const leastConnections = this.connectionCounts.get(least.id) || 0;
      const currentConnections = this.connectionCounts.get(current.id) || 0;
      return currentConnections < leastConnections ? current : least;
    });
  }

  /**
   * Weighted 전략
   */
  private selectWeighted(endpoints: WebhookEndpoint[]): WebhookEndpoint {
    const weights = this.config.weights || {};
    const totalWeight = endpoints.reduce((sum, endpoint) => {
      return sum + (weights[endpoint.id] || 1);
    }, 0);

    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      const weight = weights[endpoint.id] || 1;
      random -= weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return endpoints[0]; // fallback
  }

  /**
   * Random 전략
   */
  private selectRandom(endpoints: WebhookEndpoint[]): WebhookEndpoint {
    const randomIndex = Math.floor(Math.random() * endpoints.length);
    return endpoints[randomIndex];
  }

  /**
   * Half-open Circuit Breaker 엔드포인트 시도
   */
  private tryHalfOpenEndpoint(
    endpoints: WebhookEndpoint[],
  ): WebhookEndpoint | null {
    const now = new Date();

    for (const endpoint of endpoints) {
      const circuitBreaker = this.circuitBreakers.get(endpoint.id);

      if (
        circuitBreaker?.state === "open" &&
        circuitBreaker.nextRetryTime &&
        now >= circuitBreaker.nextRetryTime
      ) {
        circuitBreaker.state = "half-open";
        this.emit("circuitBreakerHalfOpen", { endpointId: endpoint.id });
        return endpoint;
      }
    }

    return null;
  }

  /**
   * Circuit Breaker 상태 업데이트
   */
  private updateCircuitBreaker(endpointId: string, success: boolean): void {
    let circuitBreaker = this.circuitBreakers.get(endpointId);

    if (!circuitBreaker) {
      circuitBreaker = {
        endpointId,
        state: "closed",
        failureCount: 0,
      };
      this.circuitBreakers.set(endpointId, circuitBreaker);
    }

    if (!success) {
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = new Date();

      // 5번 실패 시 Circuit Breaker 열기
      if (
        circuitBreaker.failureCount >= 5 &&
        circuitBreaker.state === "closed"
      ) {
        circuitBreaker.state = "open";
        circuitBreaker.nextRetryTime = new Date(Date.now() + 60000); // 1분 후 재시도

        this.emit("circuitBreakerOpened", {
          endpointId,
          failureCount: circuitBreaker.failureCount,
          nextRetryTime: circuitBreaker.nextRetryTime,
        });
      }
    }
  }

  /**
   * 연결 수 증가
   */
  private incrementConnections(endpointId: string): void {
    const currentCount = this.connectionCounts.get(endpointId) || 0;
    this.connectionCounts.set(endpointId, currentCount + 1);

    const health = this.endpointHealth.get(endpointId);
    if (health) {
      health.activeConnections = currentCount + 1;
    }
  }

  /**
   * 연결 수 감소
   */
  private decrementConnections(endpointId: string): void {
    const currentCount = this.connectionCounts.get(endpointId) || 0;
    const newCount = Math.max(0, currentCount - 1);
    this.connectionCounts.set(endpointId, newCount);

    const health = this.endpointHealth.get(endpointId);
    if (health) {
      health.activeConnections = newCount;
    }
  }

  /**
   * 엔드포인트 건강 상태 확인
   */
  private async checkEndpointHealth(endpoint: WebhookEndpoint): Promise<void> {
    const startTime = Date.now();

    try {
      // 간단한 HEAD 요청으로 건강 상태 확인
      const response = await fetch(endpoint.url, {
        method: "HEAD",
        signal: AbortSignal.timeout(this.config.healthCheckTimeoutMs),
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;

      await this.onRequestComplete(endpoint.id, success, responseTime);

      this.emit("healthCheckCompleted", {
        endpointId: endpoint.id,
        success,
        responseTime,
        httpStatus: response.status,
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.onRequestComplete(endpoint.id, false, responseTime);

      this.emit("healthCheckFailed", {
        endpointId: endpoint.id,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      });
    }
  }

  /**
   * 건강 상태 확인 시작
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const endpoints = Array.from(this.endpointHealth.keys());

      for (const endpointId of endpoints) {
        const health = this.endpointHealth.get(endpointId);
        if (health) {
          // 실제 구현에서는 엔드포인트 정보를 저장해야 함
          // 여기서는 모킹된 엔드포인트 사용
          const mockEndpoint: WebhookEndpoint = {
            id: endpointId,
            url: `https://webhook.example.com/${endpointId}`,
            active: true,
            events: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "active",
          };

          await this.checkEndpointHealth(mockEndpoint);
        }
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * 로드 밸런서 종료
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.emit("shutdown", {
      totalEndpoints: this.endpointHealth.size,
      activeConnections: Array.from(this.connectionCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      ),
    });
  }
}
