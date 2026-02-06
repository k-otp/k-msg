/**
 * Improved Provider Usage Examples
 * 개선된 프로바이더 사용 예시들
 */

import {
  IWINVConfigV2,
  IWINVConfigBuilder,
  ConfigFactory,
  ConfigValidator
} from '../config/provider-config-v2';

import {
  TemplateCode,
  TypedRequest,
  TemplateValidator,
  TEMPLATE_REGISTRY
} from '../types/typed-templates';

import {
  IWINVProviderV2,
  AlimTalkChannel,
  SMSChannel,
  DefaultChannelRouter,
  DefaultFallbackStrategy,
  MessageChannel
} from '../architecture/composition-provider';

import {
  TokenBucketRateLimiter,
  DefaultCircuitBreaker,
  LRUCache,
  HttpConnectionPool,
  HttpConnection,
  ResourceManager
} from '../performance/resource-management';

// =============================================================================
// 1. 개선된 설정 시스템 사용 예시
// =============================================================================

export function configurationExamples() {
  console.log('\n=== 설정 시스템 예시 ===');

  // 1-1. 빌더 패턴으로 설정 생성
  const customConfig = IWINVConfigBuilder.create()
    .environment({
      environment: 'production',
      rateLimits: {
        requestsPerSecond: 100,
        burstSize: 200,
        strategy: 'token_bucket'
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: false,
        enableHealthChecks: true,
        metricsInterval: 10000
      },
      logging: {
        level: 'info',
        structured: true,
        sensitiveDataMasking: true
      }
    })
    .alimtalk({
      type: 'alimtalk',
      apiKey: process.env.IWINV_API_KEY || 'your-api-key',
      baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
      senderKey: 'your-sender-key',
      fallbackSettings: {
        enableSMSFallback: true
      }
    })
    .sms({
      type: 'sms',
      apiKey: process.env.IWINV_API_KEY || 'your-api-key',
      baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
      senderNumber: '02-1234-5678',
      defaultMsgType: 'SMS',
      autoDetectMessageType: true
    })
    .shared({
      connectionPool: {
        maxConnections: 50,
        idleTimeout: 60000,
        connectionTimeout: 10000,
        keepAlive: true
      },
      cache: {
        enabled: true,
        ttl: 600000,
        maxSize: 10000,
        strategy: 'LRU'
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 10,
        timeoutMs: 60000,
        retryDelayMs: 30000,
        maxRetries: 5
      }
    })
    .build();

  // 1-2. 팩토리 메서드로 기본 설정 생성
  const devConfig = ConfigFactory.development();
  const prodConfig = ConfigFactory.production();
  const envConfig = ConfigFactory.fromEnvironment();

  // 1-3. 설정 검증
  const validation = ConfigValidator.validate(customConfig);
  if (!validation.isValid) {
    console.error('Configuration errors:', validation.errors);
    console.warn('Configuration warnings:', validation.warnings);
  } else {
    console.log('✅ Configuration is valid');
  }

  return customConfig;
}

// =============================================================================
// 2. 타입 안전한 템플릿 시스템 사용 예시
// =============================================================================

export function typedTemplateExamples() {
  console.log('\n=== 타입 안전한 템플릿 시스템 예시 ===');

  // 2-1. 컴파일 타임 타입 검증
  const welcomeRequest: TypedRequest<'WELCOME_001'> = {
    templateCode: 'WELCOME_001',
    phoneNumber: '010-1234-5678',
    variables: {
      name: '홍길동',
      service: 'K-MSG Platform',
      date: '2024-01-01'
      // wrongField: 'value' // ❌ 컴파일 오류 발생
    }
  };

  const otpRequest: TypedRequest<'OTP_AUTH_001'> = {
    templateCode: 'OTP_AUTH_001',
    phoneNumber: '010-9876-5432',
    variables: {
      code: '123456',
      expiry: '3분',
      serviceName: 'K-MSG' // 선택적 필드
    },
    options: {
      priority: 'high',
      channel: 'alimtalk'
    }
  };

  // 2-2. 런타임 검증
  const validation = TemplateValidator.validateVariables('WELCOME_001', {
    name: '홍길동',
    service: 'K-MSG Platform',
    date: '2024-01-01'
  });

  if (validation.isValid) {
    console.log('✅ Template variables are valid');
    console.log('Validated variables:', validation.validatedVariables);
  } else {
    console.error('Template validation errors:', validation.errors);
  }

  // 2-3. 채널 지원 여부 확인
  const supportsAlimTalk = TemplateValidator.validateChannel('WELCOME_001', 'alimtalk');
  const supportsSMS = TemplateValidator.validateChannel('WELCOME_001', 'sms');

  console.log(`WELCOME_001 supports AlimTalk: ${supportsAlimTalk}`);
  console.log(`WELCOME_001 supports SMS: ${supportsSMS}`);

  // 2-4. 템플릿 메타데이터 조회
  const templateInfo = TEMPLATE_REGISTRY['OTP_AUTH_001'];
  console.log('Template info:', {
    name: templateInfo.name,
    description: templateInfo.description,
    supportedChannels: templateInfo.channels,
    requiredVariables: Object.entries(templateInfo.variables)
      .filter(([, def]) => def.required)
      .map(([key]) => key)
  });

  return { welcomeRequest, otpRequest };
}

// =============================================================================
// 3. 컴포지션 기반 프로바이더 사용 예시
// =============================================================================

export async function compositionProviderExamples() {
  console.log('\n=== 컴포지션 기반 프로바이더 예시 ===');

  const config = ConfigFactory.development();

  // 3-1. 리소스 관리 컴포넌트 생성
  const rateLimiter = new TokenBucketRateLimiter(config.environment.rateLimits);
  const circuitBreaker = new DefaultCircuitBreaker(config.shared.circuitBreaker);
  const cache = new LRUCache(config.shared.cache);
  const connectionPool = new HttpConnectionPool(config.shared.connectionPool);

  // 3-2. HTTP 클라이언트 (Connection Pool 사용)
  class PooledHttpClient {
    constructor(private pool: HttpConnectionPool) {}

    async request(options: any) {
      const connection = await this.pool.acquire();
      try {
        return await connection.request(options);
      } finally {
        this.pool.release(connection);
      }
    }
  }

  const httpClient = new PooledHttpClient(connectionPool);

  // 3-3. 개별 채널 생성
  const channels: MessageChannel[] = [];

  if (config.alimtalk) {
    const alimtalkChannel = new AlimTalkChannel(
      config.alimtalk,
      httpClient,
      rateLimiter,
      circuitBreaker,
      cache
    );
    channels.push(alimtalkChannel);
  }

  if (config.sms) {
    const smsChannel = new SMSChannel(
      config.sms,
      httpClient,
      rateLimiter,
      circuitBreaker,
      cache
    );
    channels.push(smsChannel);
  }

  // 3-4. 라우터 및 폴백 전략
  const channelMap = new Map(channels.map(ch => [ch.type, ch]));
  const router = new DefaultChannelRouter(channelMap);
  const fallbackStrategy = new DefaultFallbackStrategy(channelMap, router);

  // 3-5. 통합 프로바이더 생성
  const provider = new IWINVProviderV2(config, router, fallbackStrategy, channels);

  // 3-6. 리소스 매니저
  const resourceManager = new ResourceManager(
    connectionPool,
    cache,
    rateLimiter,
    circuitBreaker
  );

  return { provider, resourceManager, channels };
}

// =============================================================================
// 4. 실제 사용 시나리오
// =============================================================================

export async function realWorldUsageScenarios() {
  console.log('\n=== 실제 사용 시나리오 ===');

  const { provider, resourceManager } = await compositionProviderExamples();

  // 4-1. 단일 메시지 전송 (타입 안전)
  try {
    const welcomeRequest: TypedRequest<'WELCOME_001'> = {
      templateCode: 'WELCOME_001',
      phoneNumber: '010-1234-5678',
      variables: {
        name: '홍길동',
        service: 'K-MSG Platform',
        date: new Date().toISOString().split('T')[0]
      },
      options: {
        priority: 'high',
        channel: 'alimtalk'
      }
    };

    const result = await provider.send(welcomeRequest);
    console.log('✅ Message sent:', {
      messageId: result.messageId,
      status: result.status,
      channel: result.channel
    });
  } catch (error) {
    console.error('❌ Message send failed:', error);
  }

  // 4-2. 대량 전송 (타입 안전 + 성능 최적화)
  const bulkRequests: TypedRequest<'OTP_AUTH_001'>[] = Array.from({ length: 100 }, (_, i) => ({
    templateCode: 'OTP_AUTH_001',
    phoneNumber: `010-${String(i).padStart(4, '0')}-${String(i + 1000).padStart(4, '0')}`,
    variables: {
      code: String(Math.floor(100000 + Math.random() * 900000)),
      expiry: '3분',
      serviceName: 'K-MSG'
    },
    options: {
      priority: 'normal',
      channel: 'auto' as const
    }
  }));

  try {
    const bulkResults = await provider.sendBulk(bulkRequests, {
      batchSize: 50,
      concurrency: 5
    });

    const successCount = bulkResults.filter(r => r.status === 'sent').length;
    const failCount = bulkResults.filter(r => r.status === 'failed').length;

    console.log('✅ Bulk send completed:', {
      total: bulkResults.length,
      success: successCount,
      failed: failCount,
      successRate: `${(successCount / bulkResults.length * 100).toFixed(2)}%`
    });
  } catch (error) {
    console.error('❌ Bulk send failed:', error);
  }

  // 4-3. 헬스 체크 및 모니터링
  const healthStatus = await provider.healthCheck();
  console.log('🏥 Provider health status:', healthStatus);

  const resourceHealth = await resourceManager.healthCheck();
  console.log('📊 Resource health status:', resourceHealth);

  const metrics = resourceManager.getMetrics();
  console.log('📈 Resource metrics:', {
    connectionPool: metrics.connectionPool,
    circuitBreaker: metrics.circuitBreaker.state,
    rateLimiter: `${metrics.rateLimiter.currentRate} req/s`
  });

  // 4-4. 다양한 템플릿 사용
  const differentTemplates = [
    {
      request: {
        templateCode: 'ORDER_CONFIRM_001' as const,
        phoneNumber: '010-1111-1111',
        variables: {
          orderNumber: 'ORD-202401001',
          productName: '테스트 상품',
          amount: '29,900원',
          deliveryDate: '2024-01-15',
          customerName: '김고객'
        }
      }
    },
    {
      request: {
        templateCode: 'SMS_DIRECT' as const,
        phoneNumber: '010-2222-2222',
        variables: {
          message: '[K-MSG] 긴급 알림: 시스템 점검이 예정되어 있습니다.'
        }
      }
    },
    {
      request: {
        templateCode: 'LMS_DIRECT' as const,
        phoneNumber: '010-3333-3333',
        variables: {
          subject: '중요 공지사항',
          message: '안녕하세요. K-MSG 플랫폼을 이용해주셔서 감사합니다. '.repeat(5) + '문의사항이 있으시면 언제든지 연락주세요.'
        }
      }
    }
  ];

  for (const { request } of differentTemplates) {
    try {
      const result = await provider.send(request);
      console.log(`✅ ${request.templateCode} sent: ${result.messageId}`);
    } catch (error) {
      console.error(`❌ ${request.templateCode} failed:`, error);
    }
  }

  // 4-5. 정리
  console.log('\n🧹 Cleaning up resources...');
  await resourceManager.gracefulShutdown(30000);
  await provider.destroy();
  console.log('✅ Cleanup completed');
}

// =============================================================================
// 5. 마이그레이션 가이드
// =============================================================================

export function migrationGuide() {
  console.log('\n=== 마이그레이션 가이드 ===');

  console.log(`
  기존 코드:
  ========
  import { IWINVProvider } from '@k-msg/provider';

  const provider = new IWINVProvider({
    apiKey: 'your-key',
    baseUrl: 'your-url'
  });

  await provider.send({
    templateCode: 'WELCOME_001',
    phoneNumber: '010-1234-5678',
    variables: { name: '홍길동' } // 타입 체크 없음
  });

  개선된 코드:
  ==========
  import {
    ConfigFactory,
    IWINVProviderV2,
    TypedRequest
  } from '@k-msg/provider';

  const config = ConfigFactory.fromEnvironment();
  const { provider } = await createEnhancedProvider(config);

  const request: TypedRequest<'WELCOME_001'> = {
    templateCode: 'WELCOME_001',
    phoneNumber: '010-1234-5678',
    variables: {
      name: '홍길동',
      service: 'Your Service',
      date: '2024-01-01'
    } // 컴파일 타임 타입 체크
  };

  await provider.send(request);

  주요 개선사항:
  ============
  ✅ 컴파일 타임 타입 안전성
  ✅ 계층형 설정 관리
  ✅ 컴포지션 기반 아키텍처
  ✅ 자동 폴백 및 라우팅
  ✅ Connection Pool & Caching
  ✅ Circuit Breaker & Rate Limiting
  ✅ 구조화된 로깅 및 메트릭
  ✅ Graceful Shutdown
  `);
}

// =============================================================================
// 실행 함수
// =============================================================================

export async function runAllExamples() {
  console.log('🚀 K-MSG Provider 개선사항 예시 실행');
  console.log('='.repeat(50));

  try {
    // 설정 시스템
    const config = configurationExamples();

    // 타입 안전한 템플릿
    const { welcomeRequest, otpRequest } = typedTemplateExamples();

    // 실제 사용 시나리오 (주석 처리 - 실제 API 키 필요)
    // await realWorldUsageScenarios();

    // 마이그레이션 가이드
    migrationGuide();

    console.log('\n✅ 모든 예시 실행 완료!');

  } catch (error) {
    console.error('❌ 예시 실행 중 오류:', error);
  }
}

// 팩토리 함수 - 쉬운 프로바이더 생성
export async function createEnhancedProvider(config: IWINVConfigV2) {
  const { provider, resourceManager } = await compositionProviderExamples();
  return { provider, resourceManager, config };
}

// 개발 환경용 빠른 설정
export async function createDevProvider() {
  const config = ConfigFactory.development();
  return createEnhancedProvider(config);
}

// 프로덕션 환경용 최적화된 설정
export async function createProdProvider() {
  const config = ConfigFactory.production();
  return createEnhancedProvider(config);
}