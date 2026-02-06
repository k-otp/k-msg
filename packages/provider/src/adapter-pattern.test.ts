/**
 * New Adapter Pattern Tests
 * 새 어댑터 패턴 아키텍처 테스트
 */

import { test, expect, describe, beforeEach } from 'bun:test';
import {
  globalProviderRegistry,
  UniversalProvider,
  StandardRequest,
  StandardResult,
  StandardStatus
} from '@k-msg/core';
import { IWINVAdapterFactory } from './adapters/iwinv.adapter';
import {
  IWINVProvider,
  IWINVProviderFactory,
  createIWINVProvider,
  createDefaultIWINVProvider
} from './iwinv/provider';

describe('New Adapter Pattern Architecture', () => {

  beforeEach(() => {
    // 각 테스트마다 레지스트리 초기화
    globalProviderRegistry.clear();
    // IWINV 팩토리 자동 등록
    const factory = new IWINVAdapterFactory();
    globalProviderRegistry.registerFactory(factory);
  });

  describe('IWINV Adapter Integration', () => {
    test('should register IWINV adapter factory successfully', () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      const availableProviders = globalProviderRegistry.getAvailableProviders();
      expect(availableProviders).toContain('iwinv');

      const metadata = globalProviderRegistry.getProviderMetadata('iwinv');
      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('iwinv');
      expect(metadata?.name).toBe('IWINV AlimTalk Provider');
    });

    test('should create provider instance through registry', () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      const provider = globalProviderRegistry.createProvider('iwinv', {
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      expect(provider).toBeDefined();
      expect(provider.id).toBe('iwinv');
      expect(provider.name).toBe('IWINV AlimTalk Provider');
      expect(provider.type).toBe('messaging');
      expect(provider.isReady()).toBe(true);
    });

    test('should handle standard request/response conversion', () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      const provider = globalProviderRegistry.createProvider('iwinv', {
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      const adapter = provider.getAdapter?.();
      expect(adapter).toBeDefined();

      const standardRequest: StandardRequest = {
        templateCode: 'TEST_TEMPLATE',
        phoneNumber: '010-1234-5678',
        variables: {
          name: '테스트',
          code: '123456'
        },
        options: {
          priority: 'normal',
          scheduledAt: new Date(),
          senderNumber: '02-1234-5678'
        }
      };

      const adaptedRequest = adapter.adaptRequest(standardRequest);
      expect(adaptedRequest).toBeDefined();
      expect(adaptedRequest.templateCode).toBe('TEST_TEMPLATE');
      expect(adaptedRequest.list[0].phone).toBe('010-1234-5678');
      expect(adaptedRequest.list[0].templateParam).toEqual(['테스트', '123456']);
      expect(adaptedRequest.reserve).toBe('Y'); // 예약 발송
    });

    test('should perform health check correctly', async () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      const provider = globalProviderRegistry.createProvider('iwinv', {
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      const health = await provider.healthCheck();
      expect(health).toBeDefined();
      expect(health.healthy).toBe(true);
      expect(health.issues).toEqual([]);
      expect(health.data?.provider).toBe('iwinv');
      expect(health.data?.configured).toBe(true);
    });
  });

  describe('IWINVProvider Factory Pattern', () => {
    test('should create provider using factory methods', () => {
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      expect(provider).toBeDefined();
      expect(provider.id).toBe('iwinv');
      expect(provider.name).toBe('IWINV AlimTalk Provider');
      expect(provider.isReady()).toBe(true);
    });

    test('should create provider using factory class', () => {
      const factory = IWINVProviderFactory.getInstance();
      const provider = factory.createProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      expect(provider).toBeDefined();
      expect(provider.id).toBe('iwinv');
      expect(provider.isReady()).toBe(true);
    });

    test('should handle legacy IWINVProvider wrapper', () => {
      const legacyProvider = new IWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      expect(legacyProvider.id).toBe('iwinv');
      expect(legacyProvider.name).toBe('IWINV AlimTalk Provider');
      expect(legacyProvider.type).toBe('messaging');
      expect(legacyProvider.isReady()).toBe(true);

      // 레거시 API가 여전히 작동하는지 확인
      expect(typeof legacyProvider.send).toBe('function');
      expect(typeof legacyProvider.healthCheck).toBe('function');
      expect(typeof legacyProvider.getCapabilities).toBe('function');
    });
  });

  describe('Provider Registry System', () => {
    test('should find providers by feature', () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      const alimtalkProviders = globalProviderRegistry.findProvidersByFeature('alimtalk');
      expect(alimtalkProviders).toHaveLength(1);
      expect(alimtalkProviders[0].id).toBe('iwinv');

      const templateProviders = globalProviderRegistry.findProvidersByFeature('template_messaging');
      expect(templateProviders).toHaveLength(1);
      expect(templateProviders[0].id).toBe('iwinv');
    });

    test('should handle multiple provider health checks', async () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      // 프로바이더 인스턴스 생성
      globalProviderRegistry.createProvider('iwinv', {
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr',
        debug: true
      });

      const healthResults = await globalProviderRegistry.healthCheck();
      expect(healthResults).toBeDefined();
      expect(healthResults.iwinv).toBeDefined();
      expect(healthResults.iwinv.healthy).toBe(true);
    });

    test('should get registry status', () => {
      const factory = new IWINVAdapterFactory();
      globalProviderRegistry.registerFactory(factory);

      globalProviderRegistry.createProvider('iwinv', {
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      const status = globalProviderRegistry.getStatus();
      expect(status.registeredFactories).toBe(1);
      expect(status.activeProviders).toBe(1);
      expect(status.availableProviders).toContain('iwinv');
      expect(status.metadata).toHaveLength(1);
    });
  });

  describe('Standard Interface Compliance', () => {
    test('should support all required BaseProvider methods', () => {
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

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
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

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
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      const features = provider.getSupportedFeatures();
      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features).toContain('standard_messaging');
      expect(features).toContain('error_handling');
      expect(features).toContain('status_tracking');
    });

    test('should return capabilities', () => {
      const provider = createIWINVProvider({
        apiKey: 'test-key',
        baseUrl: 'https://alimtalk.bizservice.iwinv.kr'
      });

      const capabilities = provider.getCapabilities();
      expect(capabilities).toBeDefined();
      expect(typeof capabilities.maxRecipientsPerRequest).toBe('number');
      expect(typeof capabilities.maxRequestsPerSecond).toBe('number');
      expect(typeof capabilities.supportsBulk).toBe('boolean');
      expect(typeof capabilities.supportsScheduling).toBe('boolean');
      expect(typeof capabilities.supportsTemplating).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
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
  });
});