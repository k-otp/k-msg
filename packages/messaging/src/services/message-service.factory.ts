/**
 * Message Service Factory - Provider별 자동 서비스 생성
 */

import { BaseMessageService, type MessageServiceConfig } from './base-message.service';
import { IWINVMessageService, type IWINVMessageServiceConfig } from './iwinv-message.service';
import type { BaseProvider } from '@k-msg/core';

export interface ServiceFactoryOptions {
  autoLoad?: boolean;
  debug?: boolean;
  customHandlers?: MessageServiceConfig['customHandlers'];
  providerSpecific?: {
    iwinv?: IWINVMessageServiceConfig['iwinvSpecific'];
    // 향후 다른 provider 설정 추가 가능
    // kakaobusiness?: KakaoBusinessConfig;
    // naver?: NaverConfig;
  };
}

export class MessageServiceFactory {
  /**
   * Provider를 자동 감지하여 적절한 MessageService 인스턴스 생성
   */
  static createService(
    provider: any,
    options: ServiceFactoryOptions = {}
  ): BaseMessageService {

    const baseConfig: MessageServiceConfig = {
      provider,
      debug: options.debug || false,
      autoLoad: options.autoLoad !== false,
      customHandlers: options.customHandlers
    };

    // Provider ID 기반으로 적절한 서비스 선택
    switch (provider.id?.toLowerCase()) {
      case 'iwinv':
        return new IWINVMessageService({
          ...baseConfig,
          iwinvSpecific: options.providerSpecific?.iwinv,
        });

      // 향후 다른 Provider 지원
      // case 'kakaobusiness':
      //   return new KakaoBusinessMessageService(config);
      // case 'naver':
      //   return new NaverMessageService(config);

      default:
        throw new Error(`Unsupported provider: ${provider.id}`);
    }
  }

  /**
   * 간단한 설정만으로 서비스 생성
   */
  static createIWINVService(config: {
    apiKey: string;
    baseUrl?: string;
    debug?: boolean;
    autoLoad?: boolean;
  }): IWINVMessageService {
    const { IWINVProvider } = require('@k-msg/provider');

    const provider = new IWINVProvider({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://alimtalk.bizservice.iwinv.kr',
      debug: config.debug || false
    });

    return new IWINVMessageService({
      provider,
      debug: config.debug,
      autoLoad: config.autoLoad
    });
  }

  /**
   * Provider 별 기본 설정 제공
   */
  static getProviderDefaults(providerId: string) {
    switch (providerId.toLowerCase()) {
      case 'iwinv':
        return {
          loadOptions: {
            channels: true,
            templates: true,
            analytics: false
          },
          features: {
            bulkSending: false,
            scheduling: true,
            templateVariables: true,
            maxVariables: 20,
            supportedCategories: [
              'AUTHENTICATION',
              'NOTIFICATION',
              'PROMOTION',
              'INFORMATION',
              'RESERVATION',
              'SHIPPING',
              'PAYMENT'
            ]
          }
        };

      default:
        return {
          loadOptions: {
            channels: true,
            templates: true,
            analytics: true
          },
          features: {}
        };
    }
  }
}