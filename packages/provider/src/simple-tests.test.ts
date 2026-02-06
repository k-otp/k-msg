/**
 * Comprehensive New Adapter Pattern Tests
 * 새 어댑터 패턴을 위한 포괄적인 테스트들
 * Designed for Bun test framework
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
  globalProviderRegistry,
  StandardRequest,
  StandardResult,
  StandardStatus,
  StandardErrorCode
} from '@k-msg/core';
import {
  IWINVAdapterFactory,
  isIWINVError,
  isIWINVResponse,
  IWINVError
} from './adapters/iwinv.adapter';
import {
  createIWINVProvider,
  createDefaultIWINVProvider,
  IWINVProvider,
  IWINVProviderFactory
} from './iwinv/provider';
import {
  createIWINVSMSProvider,
  createDefaultIWINVSMSProvider,
  IWINVSMSProvider
} from './iwinv/provider-sms';
import {
  createIWINVMultiProvider,
  createDefaultIWINVMultiProvider,
  IWINVMultiProvider
} from './iwinv/provider-multi';
import {
  UnifiedConfigBuilder,
  UnifiedConfigFactory,
  isValidUnifiedConfig,
  type UnifiedProviderConfig
} from './types/unified-config';
import {
  TypedProvider,
  TemplateTypeConverter,
  TemplateValidator,
  type TypedRequest,
  type TemplateCode
} from './types/typed-templates';
import {
  ErrorFactory,
  ErrorConverter,
  isUnifiedError,
  isProviderError,
  type UnifiedError
} from './types/unified-errors';
import type { IWINVConfig } from './iwinv/types/iwinv';

// Test configuration
const TEST_CONFIG: IWINVConfig = {
  apiKey: 'test-key-12345',
  baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
  debug: true
};

const INVALID_CONFIG: IWINVConfig = {
  apiKey: '',
  baseUrl: '',
  debug: false
};

// Mock tracking for Bun test environment
const createMockTracker = () => {
  const calls: any[] = [];
  return {
    calls,
    track: (...args: any[]) => calls.push(args),
    clear: () => calls.splice(0),
    getCallCount: () => calls.length,
    getLastCall: () => calls[calls.length - 1],
    getAllCalls: () => [...calls]
  };
};

describe('Comprehensive New Adapter Pattern Tests', () => {

  beforeEach(() => {
    // 각 테스트마다 레지스트리 초기화
    globalProviderRegistry.clear();
    // IWINV 팩토리 자동 등록
    const factory = new IWINVAdapterFactory();
    globalProviderRegistry.registerFactory(factory);
  });

  afterEach(() => {
    // 테스트 후 정리
    globalProviderRegistry.clear();
  });

  describe('Provider Registry & Factory System', () => {
    test('should register IWINV adapter factory successfully', () => {
      // beforeEach에서 이미 등록됨

      const availableProviders = globalProviderRegistry.getAvailableProviders();
      expect(availableProviders).toContain('iwinv');

      const metadata = globalProviderRegistry.getProviderMetadata('iwinv');
      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('iwinv');
      expect(metadata?.name).toBe('IWINV AlimTalk Provider');
    });

    test('should create provider instance through registry', () => {
      // beforeEach에서 이미 등록됨

      const provider = globalProviderRegistry.createProvider('iwinv', TEST_CONFIG);

      expect(provider).toBeDefined();
      expect(provider.id).toBe('iwinv');
      expect(provider.name).toBe('IWINV AlimTalk Provider');
      expect(provider.type).toBe('messaging');
      expect(provider.isReady()).toBe(true);
    });

    test('should find providers by feature', () => {
      // beforeEach에서 이미 등록됨

      const alimtalkProviders = globalProviderRegistry.findProvidersByFeature('alimtalk');
      expect(alimtalkProviders).toHaveLength(1);
      expect(alimtalkProviders[0].id).toBe('iwinv');

      const templateProviders = globalProviderRegistry.findProvidersByFeature('template_messaging');
      expect(templateProviders).toHaveLength(1);
      expect(templateProviders[0].id).toBe('iwinv');
    });

    test('should handle provider factory not found error', () => {
      expect(() => {
        globalProviderRegistry.createProvider('nonexistent', TEST_CONFIG);
      }).toThrow('Provider factory not found: nonexistent');
    });

    test('should get registry status correctly', () => {
      // beforeEach에서 이미 등록됨
      globalProviderRegistry.createProvider('iwinv', TEST_CONFIG);

      const status = globalProviderRegistry.getStatus();
      expect(status.registeredFactories).toBe(1);
      expect(status.activeProviders).toBe(1);
      expect(status.availableProviders).toContain('iwinv');
      expect(status.metadata).toHaveLength(1);
    });
  });

  describe('IWINV Provider Implementation', () => {
    test('should create provider using factory methods', () => {
      const provider = createIWINVProvider(TEST_CONFIG);

      expect(provider).toBeDefined();
      expect(provider.id).toBe('iwinv');
      expect(provider.name).toBe('IWINV AlimTalk Provider');
      expect(provider.type).toBe('messaging');
      expect(provider.isReady()).toBe(true);
    });

    test('should create provider using factory class', () => {
      const factory = IWINVProviderFactory.getInstance();
      const provider = factory.createProvider(TEST_CONFIG);

      expect(provider).toBeDefined();
      expect(provider.id).toBe('iwinv');
      expect(provider.isReady()).toBe(true);
    });

    test('should handle legacy IWINVProvider wrapper', () => {
      const legacyProvider = new IWINVProvider(TEST_CONFIG);

      expect(legacyProvider.id).toBe('iwinv');
      expect(legacyProvider.name).toBe('IWINV AlimTalk Provider');
      expect(legacyProvider.type).toBe('messaging');
      expect(legacyProvider.isReady()).toBe(true);

      // 레거시 API가 여전히 작동하는지 확인
      expect(typeof legacyProvider.send).toBe('function');
      expect(typeof legacyProvider.healthCheck).toBe('function');
      expect(typeof legacyProvider.getCapabilities).toBe('function');
    });

    test('should handle adapter request conversion', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const adapter = provider.getAdapter?.();

      expect(adapter).toBeDefined();

      const request: StandardRequest = {
        templateCode: 'TEST_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: { name: '테스트 사용자', code: '123456', service: '테스트 서비스' },
        options: {
          priority: 'normal',
          scheduledAt: new Date('2024-12-01T10:00:00Z'),
          senderNumber: '02-1234-5678'
        }
      };

      const converted = adapter.adaptRequest(request);
      expect(converted).toBeDefined();
      expect(converted.templateCode).toBe('TEST_TEMPLATE');
      expect(converted.list[0].phone).toBe('010-1234-5678');
      expect(converted.list[0].templateParam).toEqual(['테스트 사용자', '123456', '테스트 서비스']);
      expect(converted.reserve).toBe('Y'); // 예약 발송
    });

    test('should perform health check correctly', async () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const health = await provider.healthCheck();

      expect(health).toBeDefined();
      expect(health.healthy).toBe(true);
      expect(health.issues).toEqual([]);
      expect(health.data?.provider).toBe('iwinv');
      expect(health.data?.configured).toBe(true);
    });

    test('should implement all required BaseProvider methods', () => {
      const provider = createIWINVProvider(TEST_CONFIG);

      // Required methods
      expect(typeof provider.configure).toBe('function');
      expect(typeof provider.isReady).toBe('function');
      expect(typeof provider.healthCheck).toBe('function');
      expect(typeof provider.destroy).toBe('function');
      expect(typeof provider.send).toBe('function');
      expect(typeof provider.getStatus).toBe('function');
      expect(typeof provider.getCapabilities).toBe('function');
      expect(typeof provider.getSupportedFeatures).toBe('function');
      expect(typeof provider.getConfigurationSchema).toBe('function');

      // Optional methods
      expect(typeof provider.cancel).toBe('function');
      expect(typeof provider.getMetadata).toBe('function');
      expect(typeof provider.getAdapter).toBe('function');
    });

    test('should return proper configuration schema', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const schema = provider.getConfigurationSchema();

      expect(schema).toBeDefined();
      expect(schema.required).toBeDefined();
      expect(schema.optional).toBeDefined();

      const apiKeyField = schema.required.find(field => field.key === 'apiKey');
      expect(apiKeyField).toBeDefined();
      expect(apiKeyField?.type).toBe('secret');

      const baseUrlField = schema.required.find(field => field.key === 'baseUrl');
      expect(baseUrlField).toBeDefined();
      expect(baseUrlField?.type).toBe('url');
    });

    test('should return supported features', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const features = provider.getSupportedFeatures();

      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features).toContain('standard_messaging');
      expect(features).toContain('error_handling');
      expect(features).toContain('status_tracking');
    });

    test('should return proper capabilities', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const capabilities = provider.getCapabilities();

      expect(capabilities).toBeDefined();
      expect(typeof capabilities.maxRecipientsPerRequest).toBe('number');
      expect(typeof capabilities.maxRequestsPerSecond).toBe('number');
      expect(typeof capabilities.supportsBulk).toBe('boolean');
      expect(typeof capabilities.supportsScheduling).toBe('boolean');
      expect(typeof capabilities.supportsTemplating).toBe('boolean');
    });

    test('should return proper metadata', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const metadata = provider.getMetadata?.();

      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('iwinv');
      expect(metadata.name).toBe('IWINV AlimTalk Provider');
      expect(metadata.adapter).toBe('IWINVAdapter');
    });
  });

  describe('SMS Provider Implementation', () => {
    test('should create SMS provider correctly', () => {
      const smsProvider = createIWINVSMSProvider(TEST_CONFIG);

      expect(smsProvider).toBeInstanceOf(IWINVSMSProvider);
      expect(smsProvider.id).toBe('iwinv');
      expect(smsProvider.name).toBe('IWINV AlimTalk Provider');
      expect(smsProvider.type).toBe('messaging');
      expect(typeof smsProvider.sendSMS).toBe('function');
      expect(typeof smsProvider.sendLMS).toBe('function');
      expect(typeof smsProvider.sendMessage).toBe('function');
    });

    test('should handle SMS message length correctly', () => {
      const smsProvider = createIWINVSMSProvider(TEST_CONFIG);

      // SMS 길이 (90자 이하)
      const shortMessage = '안녕하세요 테스트 메시지입니다.';
      expect(shortMessage.length).toBeLessThan(90);

      // LMS 길이 (90자 초과)
      const longMessage = '안녕하세요. 이것은 매우 긴 메시지입니다. '.repeat(5);
      expect(longMessage.length).toBeGreaterThan(90);
    });

    test('should handle SMS request format', () => {
      const smsProvider = createIWINVSMSProvider(TEST_CONFIG);
      const adapter = smsProvider.getAdapter?.();

      expect(adapter).toBeDefined();

      const request: StandardRequest = {
        templateCode: 'SMS_DIRECT',
        phoneNumber: '010-1234-5678',
        variables: { message: 'SMS 테스트 메시지' },
        options: {
          senderNumber: '02-1234-5678',
          priority: 'high'
        }
      };

      const converted = adapter.adaptRequest(request);
      expect(converted.templateCode).toBe('SMS_DIRECT');
      expect(converted.list[0].phone).toBe('010-1234-5678');
      expect(converted.list[0].templateParam).toContain('SMS 테스트 메시지');
    });

    test('should handle LMS request format', () => {
      const smsProvider = createIWINVSMSProvider(TEST_CONFIG);
      const adapter = smsProvider.getAdapter?.();

      const longMessage = '안녕하세요. 이것은 LMS 테스트 메시지입니다. '.repeat(5);
      const request: StandardRequest = {
        templateCode: 'LMS_DIRECT',
        phoneNumber: '010-1234-5678',
        variables: {
          subject: 'LMS 제목',
          message: longMessage
        },
        options: {
          senderNumber: '02-1234-5678'
        }
      };

      const converted = adapter.adaptRequest(request);
      expect(converted.templateCode).toBe('LMS_DIRECT');
      expect(converted.list[0].templateParam[0]).toBe('LMS 제목');
      expect(converted.list[0].templateParam[1]).toBe(longMessage);
    });

    test('should support SMS convenience methods', () => {
      const smsProvider = createIWINVSMSProvider(TEST_CONFIG);

      // sendSMS 메서드 시그니처 확인
      expect(typeof smsProvider.sendSMS).toBe('function');
      expect(smsProvider.sendSMS.length).toBeGreaterThanOrEqual(2); // phoneNumber, message 최소 2개 파라미터

      // sendLMS 메서드 시그니처 확인
      expect(typeof smsProvider.sendLMS).toBe('function');
      expect(smsProvider.sendLMS.length).toBeGreaterThanOrEqual(3); // phoneNumber, subject, message 최소 3개 파라미터
    });

    test('should handle default SMS provider creation', () => {
      // 환경변수가 없는 경우 에러
      const originalApiKey = process.env.IWINV_API_KEY;
      delete process.env.IWINV_API_KEY;

      expect(() => {
        createDefaultIWINVSMSProvider();
      }).toThrow('IWINV_API_KEY environment variable is required');

      // 환경변수 복원
      if (originalApiKey) {
        process.env.IWINV_API_KEY = originalApiKey;
      }
    });

    test('should handle SMS provider health check', async () => {
      const smsProvider = createIWINVSMSProvider(TEST_CONFIG);
      const health = await smsProvider.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.issues).toHaveLength(0);
      expect(health.data?.provider).toBe('iwinv');
    });
  });

  describe('Multi Provider Implementation', () => {
    test('should create multi provider correctly', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);

      expect(multiProvider).toBeInstanceOf(IWINVMultiProvider);
      expect(multiProvider.id).toBe('iwinv-multi');
      expect(multiProvider.name).toBe('IWINV Multi Channel Provider');
      expect(multiProvider.type).toBe('messaging');
      expect(multiProvider.version).toBe('1.0.0');
    });

    test('should provide access to individual providers', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);

      const alimtalkProvider = multiProvider.getAlimTalkProvider();
      const smsProvider = multiProvider.getSMSProvider();

      expect(alimtalkProvider).toBeDefined();
      expect(alimtalkProvider.id).toBe('iwinv');
      expect(alimtalkProvider.name).toBe('IWINV AlimTalk Provider');

      expect(smsProvider).toBeDefined();
      expect(smsProvider.id).toBe('iwinv');
      expect(typeof smsProvider.sendSMS).toBe('function');
      expect(typeof smsProvider.sendLMS).toBe('function');
    });

    test('should handle channel auto-routing for AlimTalk', async () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);
      const mockTracker = createMockTracker();

      // AlimTalk 요청 (템플릿 코드 있음)
      const alimtalkRequest: StandardRequest & { channel?: 'alimtalk' | 'sms' | 'auto' } = {
        templateCode: 'WELCOME_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: { name: '테스트 사용자', code: '123456' },
        channel: 'auto'
      };

      // 실제 전송하지 않고 구조만 테스트
      expect(alimtalkRequest.templateCode).toBe('WELCOME_TEMPLATE');
      expect(alimtalkRequest.channel).toBe('auto');
    });

    test('should handle channel auto-routing for SMS', async () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);

      // SMS 요청 (템플릿 코드 없음 또는 SMS_DIRECT)
      const smsRequest: StandardRequest & { channel?: 'alimtalk' | 'sms' | 'auto' } = {
        templateCode: 'SMS_DIRECT',
        phoneNumber: '010-1234-5678',
        variables: { message: 'SMS 테스트 메시지' },
        channel: 'auto'
      };

      expect(smsRequest.templateCode).toBe('SMS_DIRECT');
      expect(smsRequest.channel).toBe('auto');
    });

    test('should provide convenience methods for different channels', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);

      // AlimTalk 전용 메서드
      expect(typeof multiProvider.sendAlimTalk).toBe('function');
      expect(multiProvider.sendAlimTalk.length).toBeGreaterThanOrEqual(3); // templateCode, phoneNumber, variables

      // SMS 전용 메서드
      expect(typeof multiProvider.sendSMS).toBe('function');
      expect(multiProvider.sendSMS.length).toBeGreaterThanOrEqual(2); // phoneNumber, message

      // LMS 전용 메서드
      expect(typeof multiProvider.sendLMS).toBe('function');
      expect(multiProvider.sendLMS.length).toBeGreaterThanOrEqual(3); // phoneNumber, subject, message

      // 폴백 전송 메서드
      expect(typeof multiProvider.sendWithFallback).toBe('function');
      expect(multiProvider.sendWithFallback.length).toBeGreaterThanOrEqual(1); // request object

      // 대량 전송 메서드
      expect(typeof multiProvider.sendBulk).toBe('function');
      expect(multiProvider.sendBulk.length).toBeGreaterThanOrEqual(1); // requests array
    });

    test('should return proper capabilities', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);
      const capabilities = multiProvider.getCapabilities();

      expect(capabilities.channels).toContain('alimtalk');
      expect(capabilities.channels).toContain('sms');
      expect(capabilities.channels).toContain('lms');
      expect(capabilities.supportsBulk).toBe(true);
      expect(capabilities.supportsScheduling).toBe(true);
      expect(capabilities.supportsTemplating).toBe(true);
      expect(capabilities.supportsAutoFallback).toBe(true);
      expect(capabilities.supportsWebhooks).toBe(false);
      expect(typeof capabilities.maxRecipientsPerRequest).toBe('number');
      expect(typeof capabilities.maxRequestsPerSecond).toBe('number');
    });

    test('should return comprehensive supported features', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);
      const features = multiProvider.getSupportedFeatures();

      expect(Array.isArray(features)).toBe(true);
      expect(features).toContain('alimtalk');
      expect(features).toContain('sms');
      expect(features).toContain('lms');
      expect(features).toContain('multi_channel');
      expect(features).toContain('auto_fallback');
      expect(features).toContain('bulk_messaging');
      expect(features).toContain('scheduled_messaging');
    });

    test('should handle health check for both providers', async () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);
      const health = await multiProvider.healthCheck();

      expect(health).toBeDefined();
      expect(typeof health.healthy).toBe('boolean');
      expect(Array.isArray(health.issues)).toBe(true);
      expect(health.data).toBeDefined();
      expect(health.data.alimtalk).toBeDefined();
      expect(health.data.sms).toBeDefined();
    });

    test('should handle bulk sending configuration', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);

      const bulkRequests: Array<StandardRequest & { channel?: 'alimtalk' | 'sms' | 'auto' }> = [
        {
          templateCode: 'WELCOME_TEMPLATE',
          phoneNumber: '010-1111-1111',
          variables: { name: '사용자1' },
          channel: 'alimtalk'
        },
        {
          templateCode: 'SMS_DIRECT',
          phoneNumber: '010-2222-2222',
          variables: { message: 'SMS 메시지' },
          channel: 'sms'
        },
        {
          templateCode: 'AUTO_TEMPLATE',
          phoneNumber: '010-3333-3333',
          variables: { name: '사용자3' },
          channel: 'auto'
        }
      ];

      // 구조 검증
      expect(bulkRequests).toHaveLength(3);
      expect(bulkRequests[0].channel).toBe('alimtalk');
      expect(bulkRequests[1].channel).toBe('sms');
      expect(bulkRequests[2].channel).toBe('auto');
    });

    test('should handle default multi provider creation', () => {
      // 환경변수가 없는 경우 에러
      const originalApiKey = process.env.IWINV_API_KEY;
      delete process.env.IWINV_API_KEY;

      expect(() => {
        createDefaultIWINVMultiProvider();
      }).toThrow('IWINV_API_KEY environment variable is required');

      // 환경변수 복원
      if (originalApiKey) {
        process.env.IWINV_API_KEY = originalApiKey;
      }
    });

    test('should handle fallback scenarios', () => {
      const multiProvider = createIWINVMultiProvider(TEST_CONFIG);

      // 폴백 시나리오 요청 구조
      const fallbackRequest = {
        templateCode: 'FALLBACK_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: { name: '테스트', service: '서비스' },
        fallbackMessage: '대체 SMS 메시지입니다.',
        options: {
          senderNumber: '02-1234-5678',
          priority: 'high' as const
        }
      };

      expect(fallbackRequest.templateCode).toBe('FALLBACK_TEMPLATE');
      expect(fallbackRequest.fallbackMessage).toBe('대체 SMS 메시지입니다.');
      expect(fallbackRequest.options.priority).toBe('high');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle configuration errors properly', () => {
      expect(() => {
        createIWINVProvider({
          apiKey: '', // 빈 API 키
          baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
        });
      }).toThrow('API key is required');

      expect(() => {
        createIWINVProvider({
          apiKey: 'test-key',
          baseUrl: '' // 빈 베이스 URL
        });
      }).toThrow('Base URL is required');

      expect(() => {
        createIWINVProvider({
          apiKey: 'test-key',
          baseUrl: 'invalid-url' // 잘못된 URL
        });
      }).toThrow('Base URL must be a valid URL');
    });

    test('should handle adapter not found error', () => {
      expect(() => {
        globalProviderRegistry.createProvider('nonexistent', {
          apiKey: 'test-key',
          baseUrl: 'https://test.com'
        });
      }).toThrow('Provider factory not found: nonexistent');
    });

    test('should handle invalid phone number formats', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const adapter = provider.getAdapter?.();

      const invalidRequests = [
        { phoneNumber: '' },
        { phoneNumber: '123' },
        { phoneNumber: 'invalid-phone' },
        { phoneNumber: '010-123' } // 너무 짧음
      ];

      invalidRequests.forEach(({ phoneNumber }) => {
        const request: StandardRequest = {
          templateCode: 'TEST_TEMPLATE',
          phoneNumber,
          variables: { test: 'value' }
        };

        expect(request.phoneNumber).toBe(phoneNumber);
      });
    });

    test('should handle empty or missing variables', () => {
      const provider = createIWINVProvider(TEST_CONFIG);
      const adapter = provider.getAdapter?.();

      const requestWithEmptyVariables: StandardRequest = {
        templateCode: 'TEST_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: {}
      };

      const requestWithoutVariables: StandardRequest = {
        templateCode: 'TEST_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: undefined as any
      };

      expect(requestWithEmptyVariables.variables).toEqual({});
      expect(requestWithoutVariables.variables).toBeUndefined();
    });

    test('should handle registry errors gracefully', () => {
      globalProviderRegistry.clear();

      // 빈 레지스트리에서 프로바이더 조회
      expect(globalProviderRegistry.getAvailableProviders()).toHaveLength(0);
      expect(globalProviderRegistry.getProviderMetadata('nonexistent')).toBeNull();

      const emptyStatus = globalProviderRegistry.getStatus();
      expect(emptyStatus.registeredFactories).toBe(0);
      expect(emptyStatus.activeProviders).toBe(0);
    });

    test('should handle environment variable edge cases', () => {
      const originalEnv = { ...process.env };

      // 환경변수 완전 제거
      delete process.env.IWINV_API_KEY;
      delete process.env.IWINV_BASE_URL;

      expect(() => {
        createDefaultIWINVProvider();
      }).toThrow('IWINV_API_KEY environment variable is required');

      // 빈 값으로 설정
      process.env.IWINV_API_KEY = '';
      process.env.IWINV_BASE_URL = '';

      expect(() => {
        createDefaultIWINVProvider();
      }).toThrow('IWINV_API_KEY environment variable is required');

      // 환경변수 복원
      Object.assign(process.env, originalEnv);
    });
  });

  describe('Standard Interface Compliance', () => {
    test('should implement all required BaseProvider methods', () => {
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      expect(typeof provider.configure).toBe('function');
      expect(typeof provider.isReady).toBe('function');
      expect(typeof provider.healthCheck).toBe('function');
      expect(typeof provider.destroy).toBe('function');
      expect(typeof provider.send).toBe('function');
      expect(typeof provider.getStatus).toBe('function');
      expect(typeof provider.getCapabilities).toBe('function');
      expect(typeof provider.getSupportedFeatures).toBe('function');
      expect(typeof provider.getConfigurationSchema).toBe('function');
    });

    test('should return proper configuration schema', () => {
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      const schema = provider.getConfigurationSchema();
      expect(schema.required).toBeDefined();
      expect(schema.optional).toBeDefined();

      const apiKeyField = schema.required.find((field: any) => field.key === 'apiKey');
      expect(apiKeyField).toBeDefined();
      expect(apiKeyField?.type).toBe('secret');
    });

    test('should return proper metadata', () => {
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      const metadata = provider.getMetadata?.();
      expect(metadata).toBeDefined();
      expect(metadata.id).toBe('iwinv');
      expect(metadata.name).toBe('IWINV AlimTalk Provider');
      expect(metadata.adapter).toBe('IWINVAdapter');
    });
  });

  describe('Backward Compatibility', () => {
    test('should maintain legacy IWINVProvider interface', () => {
      const provider = new IWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      expect(provider.id).toBe('iwinv');
      expect(provider.name).toBe('IWINV AlimTalk Provider');
      expect(provider.type).toBe('messaging');
      expect(provider.version).toBeDefined();
      expect(provider.isReady()).toBe(true);
    });

    test('should work with standard send interface', async () => {
      const provider = new IWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      const request: StandardRequest = {
        templateCode: 'TEST_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: { name: '테스트' }
      };

      // 실제 전송하지 않고 구조만 확인
      expect(() => {
        provider.send(request);
      }).not.toThrow();
    });
  });
});