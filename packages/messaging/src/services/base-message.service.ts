/**
 * Base Message Service - 공통 메시징 서비스 추상 클래스
 * Provider별 구체적인 구현을 위한 기본 틀 제공
 */

import type { BaseProvider } from '@k-msg/core';

export interface MessageServiceConfig {
  provider: any; // BaseProvider를 확장한 구체적인 provider
  debug?: boolean;
  autoLoad?: boolean;
  loadOptions?: {
    channels?: boolean;
    templates?: boolean;
    analytics?: boolean;
  };
  customHandlers?: {
    channelLoader?: ChannelLoaderFn;
    templateLoader?: TemplateLoaderFn;
    errorHandler?: ErrorHandlerFn;
  };
}

export interface ServiceState {
  isLoaded: boolean;
  channels: any[];
  providerTemplates: any[];
  localTemplates: Map<string, any>;
  messages: any[];
  loadTimestamp?: Date;
}

export type ChannelLoaderFn = (provider: any) => Promise<any[]>;
export type TemplateLoaderFn = (provider: any) => Promise<any[]>;
export type ErrorHandlerFn = (error: Error, context: string) => void;

export abstract class BaseMessageService {
  protected provider: any;
  protected config: MessageServiceConfig;
  protected state: ServiceState;

  constructor(config: MessageServiceConfig) {
    this.config = config;
    this.provider = config.provider;
    this.state = {
      isLoaded: false,
      channels: [],
      providerTemplates: [],
      localTemplates: new Map(),
      messages: []
    };

    console.log(`✅ ${this.constructor.name} initialized with ${this.provider.name}`);
    
    if (config.autoLoad !== false) {
      this.loadProviderData();
    }
  }

  // === 공통 데이터 로딩 로직 ===
  async loadProviderData(): Promise<void> {
    try {
      console.log('🔄 Loading provider data...');
      
      const loadOptions = this.config.loadOptions || {};
      
      if (loadOptions.channels !== false) {
        await this.loadChannels();
      }
      
      if (loadOptions.templates !== false) {
        await this.loadProviderTemplates();
      }
      
      this.state.isLoaded = true;
      this.state.loadTimestamp = new Date();
      console.log('✅ Provider data loaded successfully');
    } catch (error) {
      this.handleError(error as Error, 'loadProviderData');
      this.state.isLoaded = false;
    }
  }

  async loadChannels(): Promise<void> {
    try {
      if (this.config.customHandlers?.channelLoader) {
        this.state.channels = await this.config.customHandlers.channelLoader(this.provider);
      } else {
        this.state.channels = await this.defaultChannelLoader();
      }
      console.log(`📋 Loaded ${this.state.channels.length} channels`);
    } catch (error) {
      this.handleError(error as Error, 'loadChannels');
      this.state.channels = [];
    }
  }

  async loadProviderTemplates(): Promise<void> {
    try {
      if (this.config.customHandlers?.templateLoader) {
        this.state.providerTemplates = await this.config.customHandlers.templateLoader(this.provider);
      } else {
        this.state.providerTemplates = await this.defaultTemplateLoader();
      }
      console.log(`📋 Loaded ${this.state.providerTemplates.length} provider templates`);
    } catch (error) {
      this.handleError(error as Error, 'loadProviderTemplates');
      this.state.providerTemplates = [];
    }
  }

  // === 기본 로더 구현 (Provider별 오버라이드 가능) ===
  protected async defaultChannelLoader(): Promise<any[]> {
    try {
      if (this.provider.channels?.list) {
        const channels = await this.provider.channels.list();
        return Array.isArray(channels) ? channels : [];
      }
      return [];
    } catch (error) {
      console.warn('Default channel loader failed:', error);
      return [];
    }
  }

  protected async defaultTemplateLoader(): Promise<any[]> {
    try {
      if (this.provider.templates?.list) {
        const templates = await this.provider.templates.list();
        return Array.isArray(templates) ? templates : [];
      } else if (this.provider.getTemplates) {
        // Fallback to legacy method
        const result = await this.provider.getTemplates(1, 100);
        return result.list || [];
      }
      return [];
    } catch (error) {
      console.warn('Default template loader failed:', error);
      return [];
    }
  }

  // === 공통 서비스 메서드 ===
  async refreshProviderData(): Promise<{ success: boolean; message: string; isLoaded: boolean }> {
    await this.loadProviderData();
    return {
      success: true,
      message: 'Provider data refreshed',
      isLoaded: this.state.isLoaded
    };
  }

  getChannels() {
    return {
      success: true,
      channels: this.state.channels,
      isLoaded: this.state.isLoaded
    };
  }

  getTemplates(source: 'local' | 'provider' | 'all' = 'all') {
    const result: any = {
      success: true,
      isLoaded: this.state.isLoaded
    };

    if (source === 'local' || source === 'all') {
      result.localTemplates = Array.from(this.state.localTemplates.values());
    }

    if (source === 'provider' || source === 'all') {
      result.providerTemplates = this.state.providerTemplates;
    }

    if (source === 'all') {
      result.templates = [
        ...Array.from(this.state.localTemplates.values()).map(t => ({ ...t, source: 'local' })),
        ...this.state.providerTemplates.map(t => ({ ...t, source: 'provider' }))
      ];
    } else {
      result.templates = source === 'local' ? result.localTemplates : result.providerTemplates;
    }

    return result;
  }

  async healthCheck() {
    try {
      const providerHealth = await this.provider.healthCheck();
      return {
        status: 'healthy',
        provider: providerHealth.healthy,
        services: {
          template: true,
          delivery: true,
          analytics: true
        },
        isLoaded: this.state.isLoaded,
        lastLoaded: this.state.loadTimestamp,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoaded: this.state.isLoaded,
        timestamp: new Date().toISOString()
      };
    }
  }

  // === 추상 메서드 (Provider별 구현 필요) ===
  abstract createTemplate(name: string, content: string, category: string): Promise<any>;
  abstract sendMessage(phoneNumber: string, templateName: string, variables: Record<string, any>): Promise<any>;
  
  // === 유틸리티 메서드 ===
  protected handleError(error: Error, context: string): void {
    if (this.config.customHandlers?.errorHandler) {
      this.config.customHandlers.errorHandler(error, context);
    } else {
      console.warn(`⚠️  ${context} failed:`, error);
    }
  }

  protected parseTemplateVariables(content: string) {
    const matches = content.match(/#{([^}]+)}/g) || [];
    return matches.map((match: string) => ({
      name: match.slice(2, -1),
      type: 'string' as const,
      required: true
    })).filter((v, index, self) => 
      index === self.findIndex(item => item.name === v.name)
    );
  }
}