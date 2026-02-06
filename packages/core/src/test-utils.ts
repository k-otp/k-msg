/**
 * Test utilities for K-Message Platform
 */

import { expect } from 'bun:test';
import type { BaseProvider, ProviderHealthStatus, PlatformHealthStatus } from './index';
import { KMessageError, KMessageErrorCode, ProviderError, TemplateError, MessageError } from './errors';

/**
 * Mock provider for testing
 */
export class MockProvider implements BaseProvider {
  public readonly id: string;
  public readonly name: string;
  public readonly type = 'messaging' as const;
  public readonly version = '1.0.0';
  private _healthy: boolean = true;
  private _issues: string[] = [];
  private _balance: string = '1000';
  private _templates: any[] = [];
  private _history: any[] = [];

  constructor(id: string = 'mock', name: string = 'Mock Provider') {
    this.id = id;
    this.name = name;
  }

  // BaseProvider lifecycle methods
  configure(config: Record<string, unknown>): void {
    // Mock configuration
  }

  isReady(): boolean {
    return this._healthy;
  }

  destroy(): void {
    // Mock cleanup
  }

  // Health check simulation
  async healthCheck(): Promise<ProviderHealthStatus> {
    return {
      healthy: this._healthy,
      issues: [...this._issues],
      data: {
        balance: this._balance,
        status: this._healthy ? 'connected' : 'disconnected',
        code: this._healthy ? 200 : 500,
        message: this._healthy ? 'OK' : 'Service unavailable'
      }
    };
  }

  // Core send method - new BaseProvider interface
  async send(request: any): Promise<any> {
    if (!this._healthy) {
      throw new MessageError(request.phoneNumber || 'unknown', KMessageErrorCode.MESSAGE_SEND_FAILED, 'Provider is unhealthy');
    }

    if (request.phoneNumber === '01000000000') {
      throw new MessageError(request.phoneNumber, KMessageErrorCode.MESSAGE_INVALID_PHONE_NUMBER, 'Invalid phone number');
    }

    return {
      messageId: `mock_${Date.now()}`,
      status: { status: 'sent', timestamp: new Date() },
      provider: this.id,
      timestamp: new Date(),
      templateCode: request.templateCode,
      phoneNumber: request.phoneNumber
    };
  }

  // Status tracking
  async getStatus(requestId: string) {
    return { status: 'delivered' as const, timestamp: new Date() };
  }

  async cancel(requestId: string): Promise<boolean> {
    return this._healthy;
  }

  // Capabilities discovery
  getCapabilities() {
    return {};
  }

  getSupportedFeatures(): string[] {
    return ['messaging', 'templates'];
  }

  getConfigurationSchema() {
    return { required: [], optional: [] };
  }

  // Test helpers
  setHealthy(healthy: boolean, issues: string[] = []) {
    this._healthy = healthy;
    this._issues = issues;
  }

  setBalance(balance: string) {
    this._balance = balance;
  }

  setTemplates(templates: any[]) {
    this._templates = templates;
  }

  setHistory(history: any[]) {
    this._history = history;
  }

  // Provider methods with mock implementations
  async sendMessage(templateCode: string, phoneNumber: string, variables: Record<string, any>, options?: any) {
    if (!this._healthy) {
      throw new MessageError(phoneNumber, KMessageErrorCode.MESSAGE_SEND_FAILED, 'Provider is unhealthy');
    }
    
    if (phoneNumber === '01000000000') {
      throw new MessageError(phoneNumber, KMessageErrorCode.MESSAGE_INVALID_PHONE_NUMBER, 'Invalid phone number');
    }

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      status: 'sent',
      error: null
    };
  }

  async getTemplates(page: number = 1, size: number = 15, filters?: any) {
    if (!this._healthy) {
      throw new ProviderError(this.id, KMessageErrorCode.PROVIDER_NOT_AVAILABLE, 'Provider is unhealthy');
    }

    const start = (page - 1) * size;
    const end = start + size;
    const list = this._templates.slice(start, end);

    return {
      code: 200,
      message: 'Success',
      totalCount: this._templates.length,
      list
    };
  }

  async createTemplate(name: string, content: string, category?: string, buttons?: any[]) {
    if (!this._healthy) {
      throw new TemplateError(name, KMessageErrorCode.TEMPLATE_CREATION_FAILED, 'Provider is unhealthy');
    }

    if (name === 'invalid_template') {
      throw new TemplateError(name, KMessageErrorCode.TEMPLATE_VALIDATION_FAILED, 'Template validation failed');
    }

    const templateCode = `mock_${name}_${Date.now()}`;
    this._templates.push({
      templateCode,
      templateName: name,
      templateContent: content,
      status: 'Y',
      createDate: new Date().toISOString()
    });

    return {
      success: true,
      templateCode,
      status: 'created',
      error: null
    };
  }

  async modifyTemplate(templateCode: string, name: string, content: string, buttons?: any[]) {
    if (!this._healthy) {
      throw new TemplateError(templateCode, KMessageErrorCode.TEMPLATE_MODIFICATION_FAILED, 'Provider is unhealthy');
    }

    const template = this._templates.find(t => t.templateCode === templateCode);
    if (!template) {
      throw new TemplateError(templateCode, KMessageErrorCode.TEMPLATE_NOT_FOUND, 'Template not found');
    }

    template.templateName = name;
    template.templateContent = content;

    return {
      success: true,
      templateCode,
      status: 'modified',
      error: null
    };
  }

  async deleteTemplate(templateCode: string) {
    if (!this._healthy) {
      throw new TemplateError(templateCode, KMessageErrorCode.TEMPLATE_DELETION_FAILED, 'Provider is unhealthy');
    }

    const index = this._templates.findIndex(t => t.templateCode === templateCode);
    if (index === -1) {
      return {
        code: 404,
        message: 'Template not found'
      };
    }

    this._templates.splice(index, 1);
    return {
      code: 200,
      message: 'Template deleted successfully'
    };
  }

  async getHistory(page: number = 1, size: number = 15, filters?: any) {
    if (!this._healthy) {
      throw new ProviderError(this.id, KMessageErrorCode.PROVIDER_NOT_AVAILABLE, 'Provider is unhealthy');
    }

    const start = (page - 1) * size;
    const end = start + size;
    const list = this._history.slice(start, end);

    return {
      code: 200,
      message: 'Success',
      totalCount: this._history.length,
      list
    };
  }

  async cancelReservation(messageId: string) {
    if (!this._healthy) {
      throw new KMessageError(KMessageErrorCode.MESSAGE_CANCELLATION_FAILED, 'Provider is unhealthy');
    }

    return {
      code: 200,
      message: 'Reservation cancelled successfully'
    };
  }
}

/**
 * Test assertion helpers
 */
export const TestAssertions = {
  /**
   * Assert that an error is a KMessageError with specific code
   */
  assertKMessageError: (error: unknown, expectedCode: KMessageErrorCode, expectedMessage?: string) => {
    expect(error).toBeInstanceOf(KMessageError);
    const kError = error as KMessageError;
    expect(kError.code).toBe(expectedCode);
    if (expectedMessage) {
      expect(kError.message).toContain(expectedMessage);
    }
  },

  /**
   * Assert that an error is retryable
   */
  assertRetryable: (error: KMessageError, expected: boolean = true) => {
    expect(error.retryable).toBe(expected);
  },

  /**
   * Assert that a health status is healthy
   */
  assertHealthy: (health: ProviderHealthStatus | PlatformHealthStatus, expected: boolean = true) => {
    expect(health.healthy).toBe(expected);
    if (!expected) {
      expect(health.issues.length).toBeGreaterThan(0);
    }
  },

  /**
   * Assert that a provider result has expected structure
   */
  assertProviderResult: (result: any, expectSuccess: boolean = true) => {
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(expectSuccess);
    
    if (expectSuccess) {
      expect(result.error).toBeNull();
    } else {
      expect(result.error).toBeDefined();
    }
  },

  /**
   * Assert that API response has expected structure
   */
  assertApiResponse: (response: any, expectedCode: number = 200) => {
    expect(response).toHaveProperty('code');
    expect(response).toHaveProperty('message');
    expect(response.code).toBe(expectedCode);
  }
};

/**
 * Test data generators
 */
export const TestData = {
  createMockTemplate: (overrides: Partial<any> = {}) => ({
    templateCode: 'mock_template_001',
    templateName: 'Mock Template',
    templateContent: '[#{서비스명}] 안녕하세요, #{고객명}님!',
    status: 'Y',
    createDate: '2024-01-01 12:00:00',
    ...overrides
  }),

  createMockMessage: (overrides: Partial<any> = {}) => ({
    seqNo: 12345,
    phone: '01012345678',
    templateCode: 'mock_template_001',
    statusCode: 'OK',
    statusCodeName: '성공',
    requestDate: '2024-01-01 12:00:00',
    sendDate: '2024-01-01 12:01:00',
    receiveDate: '2024-01-01 12:01:30',
    sendMessage: '[MyApp] 안녕하세요, 홍길동님!',
    ...overrides
  }),

  createMockVariables: (overrides: Record<string, any> = {}) => ({
    서비스명: 'MyApp',
    고객명: '홍길동',
    인증코드: '123456',
    ...overrides
  }),

  generatePhoneNumber: (valid: boolean = true) => {
    if (valid) {
      const numbers = ['010', '011', '016', '017', '018', '019'];
      const prefix = numbers[Math.floor(Math.random() * numbers.length)];
      const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      return prefix + suffix;
    } else {
      return '01000000000'; // Known invalid number for testing
    }
  }
};

/**
 * Test environment setup helpers
 */
export const TestSetup = {
  /**
   * Create a test environment with mock providers
   */
  createTestEnvironment: () => {
    const mockProviders = {
      healthy: new MockProvider('healthy', 'Healthy Provider'),
      unhealthy: new MockProvider('unhealthy', 'Unhealthy Provider'),
      rateLimited: new MockProvider('ratelimited', 'Rate Limited Provider')
    };

    // Configure unhealthy provider
    mockProviders.unhealthy.setHealthy(false, ['Connection failed', 'Authentication error']);
    
    // Configure rate limited provider
    mockProviders.rateLimited.setHealthy(true);

    return {
      providers: mockProviders,
      cleanup: () => {
        // Cleanup logic if needed
      }
    };
  },

  /**
   * Create test data for various scenarios
   */
  createTestScenarios: () => ({
    validMessage: {
      templateCode: 'valid_template',
      phoneNumber: TestData.generatePhoneNumber(true),
      variables: TestData.createMockVariables()
    },
    invalidMessage: {
      templateCode: 'invalid_template',
      phoneNumber: TestData.generatePhoneNumber(false),
      variables: {}
    },
    templates: [
      TestData.createMockTemplate({ templateCode: 'template_001', templateName: 'Welcome Message' }),
      TestData.createMockTemplate({ templateCode: 'template_002', templateName: 'OTP Message' }),
      TestData.createMockTemplate({ templateCode: 'template_003', templateName: 'Notification' })
    ],
    history: [
      TestData.createMockMessage({ seqNo: 1, templateCode: 'template_001' }),
      TestData.createMockMessage({ seqNo: 2, templateCode: 'template_002' }),
      TestData.createMockMessage({ seqNo: 3, templateCode: 'template_003' })
    ]
  })
};

/**
 * Performance testing helpers
 */
export const PerformanceTest = {
  /**
   * Measure execution time of a function
   */
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  /**
   * Run a function multiple times and get statistics
   */
  benchmark: async <T>(fn: () => Promise<T>, iterations: number = 10): Promise<{
    results: T[];
    statistics: {
      min: number;
      max: number;
      average: number;
      median: number;
    };
  }> => {
    const results: T[] = [];
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, duration } = await PerformanceTest.measureTime(fn);
      results.push(result);
      durations.push(duration);
    }

    durations.sort((a, b) => a - b);
    const statistics = {
      min: durations[0],
      max: durations[durations.length - 1],
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)]
    };

    return { results, statistics };
  }
};