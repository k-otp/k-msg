/**
 * Universal Provider Implementation
 * 어댑터 패턴을 사용한 범용 프로바이더
 */

import {
  BaseProvider,
  BaseProviderAdapter,
  StandardRequest,
  StandardResult,
  StandardError,
  StandardStatus,
  StandardErrorCode,
  ProviderConfig,
  DeliveryStatus,
  ConfigurationSchema,
  ProviderHealthStatus
} from './index';

/**
 * 어댑터 기반 범용 프로바이더
 * 모든 프로바이더가 이 클래스를 사용하여 표준 인터페이스 구현
 */
export class UniversalProvider implements BaseProvider<StandardRequest, StandardResult> {
  public readonly id: string;
  public readonly name: string;
  public readonly type = 'messaging' as const;
  public readonly version: string;

  private adapter: BaseProviderAdapter;
  private config: ProviderConfig;
  private isConfigured = false;

  constructor(
    adapter: BaseProviderAdapter,
    metadata: {
      id: string;
      name: string;
      version: string;
    }
  ) {
    this.adapter = adapter;
    this.id = metadata.id;
    this.name = metadata.name;
    this.version = metadata.version;
    this.config = adapter['config']; // 어댑터에서 설정 가져오기
    this.isConfigured = true;
  }

  configure(config: Record<string, unknown>): void {
    this.config = config as ProviderConfig;
    this.adapter = new (this.adapter.constructor as any)(config);
    this.isConfigured = true;
  }

  isReady(): boolean {
    return this.isConfigured && !!this.config.apiKey && !!this.config.baseUrl;
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const issues: string[] = [];
    const startTime = Date.now();

    try {
      if (!this.isReady()) {
        issues.push('Provider is not configured properly');
        return { healthy: false, issues };
      }

      // 간단한 연결 테스트 (실제 요청 없이 URL 검증)
      const baseUrl = this.adapter.getBaseUrl();
      try {
        new URL(baseUrl);
      } catch {
        issues.push('Invalid base URL configuration');
      }

      // 인증 헤더 검증
      try {
        const headers = this.adapter.getAuthHeaders();
        if (!headers || Object.keys(headers).length === 0) {
          issues.push('Authentication headers not properly configured');
        }
      } catch (error) {
        issues.push(`Authentication configuration error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }

      const latency = Date.now() - startTime;

      return {
        healthy: issues.length === 0,
        issues,
        latency,
        data: {
          provider: this.id,
          baseUrl: this.adapter.getBaseUrl(),
          configured: this.isConfigured
        }
      };

    } catch (error) {
      issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        healthy: false,
        issues,
        latency: Date.now() - startTime
      };
    }
  }

  destroy(): void {
    this.isConfigured = false;
    this.config = {} as ProviderConfig;
  }

  async send<T extends StandardRequest = StandardRequest, R extends StandardResult = StandardResult>(
    request: T
  ): Promise<R> {
    if (!this.isReady()) {
      throw new Error('Provider is not configured');
    }

    try {
      // 1. 표준 요청을 프로바이더별 형식으로 변환
      const adaptedRequest = this.adapter.adaptRequest(request);

      // 2. HTTP 요청 실행
      const response = await this.makeHttpRequest(adaptedRequest);

      // 3. 응답을 표준 형식으로 변환
      const result = this.adapter.adaptResponse(response);

      // 4. 요청 정보 보완 (어댑터에서 누락될 수 있는 정보)
      result.phoneNumber = request.phoneNumber;

      return result as R;

    } catch (error) {
      // 에러를 표준 형식으로 변환하여 반환
      const standardError = this.adapter.mapError(error);

      const errorResult: StandardResult = {
        messageId: this.adapter['generateMessageId']?.() || `error_${Date.now()}`,
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: standardError
      };

      return errorResult as R;
    }
  }

  async getStatus(requestId: string): Promise<DeliveryStatus> {
    try {
      // 프로바이더별 상태 조회 로직
      // 현재는 기본 구현, 추후 어댑터에 추가 가능
      const url = `${this.adapter.getBaseUrl()}${this.adapter.getEndpoint('status')}`;
      const config = this.adapter.getRequestConfig();

      const response = await fetch(url, {
        ...config,
        body: JSON.stringify({ messageId: requestId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = this.adapter.adaptResponse(data);

      return {
        status: this.mapStandardStatusToDeliveryStatus(result.status),
        timestamp: result.timestamp,
        details: result.metadata || {}
      };

    } catch (error) {
      return {
        status: 'failed',
        timestamp: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId
        }
      };
    }
  }

  async cancel(requestId: string): Promise<boolean> {
    try {
      const url = `${this.adapter.getBaseUrl()}${this.adapter.getEndpoint('cancel')}`;
      const config = this.adapter.getRequestConfig();

      const response = await fetch(url, {
        ...config,
        body: JSON.stringify({ messageId: requestId })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  getCapabilities(): any {
    // 기본 capabilities, 어댑터에서 오버라이드 가능
    return {
      maxRecipientsPerRequest: 1,
      maxRequestsPerSecond: 10,
      supportsBulk: false,
      supportsScheduling: true,
      supportsTemplating: true,
      supportsWebhooks: false
    };
  }

  getSupportedFeatures(): string[] {
    return [
      'standard_messaging',
      'error_handling',
      'status_tracking',
      'configuration_validation'
    ];
  }

  getConfigurationSchema(): ConfigurationSchema {
    return {
      required: [
        {
          key: 'apiKey',
          type: 'secret',
          description: 'API key for authentication'
        },
        {
          key: 'baseUrl',
          type: 'url',
          description: 'Base URL for the provider API'
        }
      ],
      optional: [
        {
          key: 'debug',
          type: 'boolean',
          description: 'Enable debug logging'
        },
        {
          key: 'timeout',
          type: 'number',
          description: 'Request timeout in milliseconds'
        }
      ]
    };
  }

  /**
   * HTTP 요청 실행
   */
  private async makeHttpRequest(data: any): Promise<any> {
    const url = `${this.adapter.getBaseUrl()}${this.adapter.getEndpoint('send')}`;
    const config = this.adapter.getRequestConfig();

    if (this.config.debug) {
      console.log(`[${this.id}] Making request to:`, url);
      console.log(`[${this.id}] Request data:`, JSON.stringify(data).substring(0, 200));
    }

    const response = await fetch(url, {
      ...config,
      body: JSON.stringify(data)
    });

    const responseText = await response.text();

    if (this.config.debug) {
      console.log(`[${this.id}] Response status:`, response.status);
      console.log(`[${this.id}] Response body:`, responseText.substring(0, 500));
    }

    if (!this.adapter.validateResponse(response)) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  }

  /**
   * 표준 상태를 DeliveryStatus로 변환
   */
  private mapStandardStatusToDeliveryStatus(status: StandardStatus): 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled' {
    switch (status) {
      case StandardStatus.PENDING:
        return 'pending';
      case StandardStatus.SENT:
        return 'sent';
      case StandardStatus.DELIVERED:
        return 'delivered';
      case StandardStatus.FAILED:
        return 'failed';
      case StandardStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  /**
   * 어댑터 인스턴스 반환 (고급 사용자용)
   */
  getAdapter(): BaseProviderAdapter {
    return this.adapter;
  }

  /**
   * 프로바이더 메타데이터 반환
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      adapter: this.adapter.constructor.name
    };
  }
}