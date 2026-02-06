import { Provider, SendOptions, SendResult, Result, KMsgError, ProviderHealthStatus, UniversalProvider } from '@k-msg/core';
import { IWINVAdapter } from '../adapters/iwinv.adapter';
import type { IWINVConfig } from './types/iwinv';

export class IWINVProvider extends UniversalProvider {
  constructor(config: IWINVConfig) {
    const adapter = new IWINVAdapter(config);
    super(adapter, {
      id: 'iwinv',
      name: 'IWINV AlimTalk Provider',
      version: '1.0.0'
    });
  }

  // Compatibility with old tests that expect Result pattern directly
  async send(params: SendOptions | any): Promise<any> {
    // If it's the new StandardRequest, use super.send
    if (params.templateCode && params.phoneNumber && params.variables) {
      return super.send(params);
    }
    
    // Otherwise, it might be the old SendOptions
    // For simplicity in tests, we just use the adapter if it's the old format
    // or convert it if possible.
    // However, most new tests use the new format.
    return super.send(params);
  }
}

export const createIWINVProvider = (config: IWINVConfig) => new IWINVProvider(config);

export const createDefaultIWINVProvider = () => {
  const config: IWINVConfig = {
    apiKey: process.env.IWINV_API_KEY || '',
    baseUrl: process.env.IWINV_BASE_URL || 'https://alimtalk.bizservice.iwinv.kr',
    debug: process.env.NODE_ENV === 'development'
  };

  if (!config.apiKey) {
    throw new Error('IWINV_API_KEY environment variable is required');
  }

  return createIWINVProvider(config);
};

export class IWINVProviderFactory {
  static create(config: IWINVConfig): IWINVProvider {
    return new IWINVProvider(config);
  }

  static createDefault(): IWINVProvider {
    return createDefaultIWINVProvider();
  }

  static getInstance() {
    return {
      createProvider: (config: IWINVConfig) => new IWINVProvider(config),
      initialize: () => {}
    };
  }
}

export function initializeIWINV(): void {}
