/**
 * IWINV Provider - New Adapter Pattern Implementation
 * 새 어댑터 패턴을 사용한 IWINV 프로바이더 구현
 */

import {
  globalProviderRegistry,
  UniversalProvider,
  BaseProvider,
  StandardRequest,
  StandardResult
} from '@k-msg/core';
import { IWINVAdapterFactory } from '../adapters/iwinv.adapter';
import type { IWINVConfig } from './types/iwinv';

/**
 * 새 어댑터 패턴을 사용한 IWINV 프로바이더 팩토리
 */
export class IWINVProviderFactory {
  private static instance: IWINVProviderFactory;
  private initialized = false;

  static getInstance(): IWINVProviderFactory {
    if (!this.instance) {
      this.instance = new IWINVProviderFactory();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 글로벌 레지스트리에 IWINV 어댑터 팩토리 등록
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    const adapterFactory = new IWINVAdapterFactory();
    globalProviderRegistry.registerFactory(adapterFactory);
    this.initialized = true;
  }

  /**
   * IWINV 프로바이더 인스턴스 생성
   */
  createProvider(config: IWINVConfig): BaseProvider<StandardRequest, StandardResult> {
    this.initialize();
    return globalProviderRegistry.createProvider('iwinv', config);
  }

  /**
   * 설정이 포함된 즉시 사용 가능한 프로바이더 생성
   */
  static create(config: IWINVConfig): BaseProvider<StandardRequest, StandardResult> {
    return IWINVProviderFactory.getInstance().createProvider(config);
  }

  /**
   * 환경변수를 사용한 기본 프로바이더 생성
   */
  static createDefault(): BaseProvider<StandardRequest, StandardResult> {
    const config: IWINVConfig = {
      apiKey: process.env.IWINV_API_KEY || '',
      baseUrl: process.env.IWINV_BASE_URL || 'https://alimtalk.bizservice.iwinv.kr',
      debug: process.env.NODE_ENV === 'development'
    };

    if (!config.apiKey) {
      throw new Error('IWINV_API_KEY environment variable is required');
    }

    return this.create(config);
  }
}

/**
 * 레거시 호환성을 위한 IWINVProvider 클래스
 * @deprecated Use IWINVProviderFactory.create() instead
 */
export class IWINVProvider {
  private provider: BaseProvider<StandardRequest, StandardResult>;

  constructor(config: IWINVConfig) {
    this.provider = IWINVProviderFactory.create(config);
  }

  get id(): string {
    return this.provider.id;
  }

  get name(): string {
    return this.provider.name;
  }

  get type() {
    return this.provider.type;
  }

  get version(): string {
    return this.provider.version;
  }

  configure(config: Record<string, unknown>): void {
    return this.provider.configure(config);
  }

  isReady(): boolean {
    return this.provider.isReady();
  }

  async healthCheck() {
    return this.provider.healthCheck();
  }

  destroy(): void {
    return this.provider.destroy();
  }

  async send<T extends StandardRequest = StandardRequest, R extends StandardResult = StandardResult>(
    request: T
  ): Promise<R> {
    return this.provider.send(request);
  }

  async getStatus(requestId: string) {
    return this.provider.getStatus(requestId);
  }

  async cancel(requestId: string): Promise<boolean> {
    return this.provider.cancel?.(requestId) || false;
  }

  getCapabilities() {
    return this.provider.getCapabilities();
  }

  getSupportedFeatures(): string[] {
    return this.provider.getSupportedFeatures();
  }

  getConfigurationSchema() {
    return this.provider.getConfigurationSchema();
  }

  getMetadata() {
    return this.provider.getMetadata?.();
  }

  getAdapter() {
    return this.provider.getAdapter?.();
  }
}

/**
 * 편의 함수들
 */
export const createIWINVProvider = (config: IWINVConfig) => IWINVProviderFactory.create(config);
export const createDefaultIWINVProvider = () => IWINVProviderFactory.createDefault();

/**
 * 글로벌 초기화 함수
 */
export function initializeIWINV(): void {
  IWINVProviderFactory.getInstance().initialize();
}