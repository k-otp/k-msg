/**
 * IWINV Multi-Type Provider
 * Supports both AlimTalk and SMS in a single provider instance
 */

import { BaseAlimTalkProvider } from '../abstract/provider.base';
import {
  AlimTalkProvider,
  AlimTalkRequest,
  AlimTalkResult,
  ProviderCapabilities,
  ProviderConfiguration,
  ConfigurationField,
  MessageStatus
} from '../contracts/provider.contract';
import {
  SMSProvider,
  SMSRequest,
  SMSResult,
  SMSCapabilities
} from '../contracts/sms.contract';
import type { DeliveryStatus, ConfigurationSchema, ProviderType } from '@k-msg/core';

import { IWINVMessagingContract } from './contracts/messaging.contract';
import { IWINVTemplateContract } from './contracts/template.contract';
import { IWINVChannelContract } from './contracts/channel.contract';
import { IWINVAnalyticsContract } from './contracts/analytics.contract';
import { IWINVAccountContract } from './contracts/account.contract';
import { IWINVSMSContract, IWINVSMSAccountContract } from './contracts/sms.contract';

import type { IWINVConfig } from './types/iwinv';

// Multi-type request union
export type IWINVRequest = AlimTalkRequest | SMSRequest;
export type IWINVResult = AlimTalkResult | SMSResult;

export interface MultiProviderCapabilities {
  alimtalk: ProviderCapabilities;
  sms: SMSCapabilities;
}

export class IWINVMultiProvider extends BaseAlimTalkProvider {
  public readonly id = 'iwinv-multi';
  public readonly name = 'IWINV Multi-Type Provider (AlimTalk + SMS)';
  public readonly version = '1.0.0';

  // AlimTalk capabilities
  public readonly capabilities: ProviderCapabilities = {
    templates: {
      maxLength: 1000,
      maxVariables: 20,
      maxButtons: 5,
      supportedButtonTypes: ['WL', 'AL', 'DB', 'BK', 'MD'],
      requiresApproval: true,
      approvalTime: '1-2 days'
    },
    messaging: {
      maxRecipientsPerRequest: 1,
      maxRequestsPerSecond: 100,
      supportsBulk: false,
      supportsScheduling: true,
      maxScheduleDays: 30,
      supportsFallback: true
    },
    channels: {
      requiresBusinessVerification: true,
      maxSenderNumbers: 10,
      supportsMultipleChannels: false
    }
  };

  // SMS capabilities
  public readonly smsCapabilities: SMSCapabilities = {
    sms: {
      maxLength: 90,
      supportsBulk: true,
      maxRecipientsPerRequest: 100,
      maxRequestsPerSecond: 50,
      supportsScheduling: true,
      maxScheduleDays: 30
    },
    lms: {
      maxLength: 2000,
      supportsSubject: true,
      maxSubjectLength: 40,
      supportsBulk: true
    },
    senderNumbers: {
      requiresVerification: true,
      maxSenderNumbers: 20,
      supportsCustomNumbers: true
    }
  };

  // AlimTalk contract implementations
  public templates: IWINVTemplateContract;
  public channels: IWINVChannelContract;
  public messaging: IWINVMessagingContract;
  public analytics: IWINVAnalyticsContract;
  public account: IWINVAccountContract;

  // SMS contract implementations
  public sms: IWINVSMSContract;
  public smsAccount: IWINVSMSAccountContract;

  constructor(config?: Record<string, unknown>) {
    super(config);

    const iwinvConfig = this.getIWINVConfig();

    // AlimTalk contracts
    this.templates = new IWINVTemplateContract(iwinvConfig);
    this.channels = new IWINVChannelContract(iwinvConfig);
    this.messaging = new IWINVMessagingContract(iwinvConfig);
    this.analytics = new IWINVAnalyticsContract(iwinvConfig);
    this.account = new IWINVAccountContract(iwinvConfig);

    // SMS contracts
    this.sms = new IWINVSMSContract(iwinvConfig);
    this.smsAccount = new IWINVSMSAccountContract(iwinvConfig);
  }

  // BaseProvider 필수 메서드 구현 (AlimTalk 기본)
  public async send<T extends AlimTalkRequest = AlimTalkRequest, R extends AlimTalkResult = AlimTalkResult>(request: T): Promise<R> {
    const result = await this.messaging.send(request);
    return {
      messageId: result.messageId,
      status: this.mapMessageStatusToDeliveryStatus(result.status),
      provider: this.id,
      timestamp: result.sentAt || new Date(),
      templateCode: request.templateCode,
      phoneNumber: request.phoneNumber,
      deliveredAt: result.sentAt,
      error: result.error
    } as R;
  }

  // SMS 전용 send 메서드
  public async sendSMS(request: SMSRequest): Promise<SMSResult> {
    return this.sms.send({
      phoneNumber: request.phoneNumber,
      text: request.text,
      senderNumber: request.senderNumber,
      options: request.options
    });
  }

  // 통합 send 메서드 (타입에 따라 자동 라우팅)
  public async sendMessage(request: IWINVRequest): Promise<IWINVResult> {
    if (this.isAlimTalkRequest(request)) {
      return this.send(request);
    } else if (this.isSMSRequest(request)) {
      return this.sendSMS(request);
    } else {
      throw new Error('Invalid request type');
    }
  }

  public async getStatus(requestId: string): Promise<DeliveryStatus> {
    // AlimTalk 상태 확인 시도
    try {
      const alimTalkStatus = await this.messaging.getStatus(requestId);
      return {
        status: alimTalkStatus === 'DELIVERED' ? 'delivered' :
               alimTalkStatus === 'SENT' ? 'sent' :
               alimTalkStatus === 'FAILED' ? 'failed' :
               alimTalkStatus === 'CANCELLED' ? 'cancelled' : 'pending',
        timestamp: new Date(),
        details: { requestId, type: 'alimtalk' }
      };
    } catch {
      // SMS 상태 확인 시도
      try {
        const smsStatus = await this.sms.getStatus(requestId);
        return {
          status: smsStatus === 'DELIVERED' ? 'delivered' :
                 smsStatus === 'SENT' ? 'sent' :
                 smsStatus === 'FAILED' ? 'failed' :
                 smsStatus === 'CANCELLED' ? 'cancelled' : 'pending',
          timestamp: new Date(),
          details: { requestId, type: 'sms' }
        };
      } catch {
        throw new Error(`Message not found: ${requestId}`);
      }
    }
  }

  public async cancel(requestId: string): Promise<boolean> {
    // AlimTalk 취소 시도
    try {
      await this.messaging.cancel(requestId);
      return true;
    } catch {
      // SMS 취소 시도
      try {
        await this.sms.cancel(requestId);
        return true;
      } catch {
        return false;
      }
    }
  }

  public getSupportedFeatures(): string[] {
    return [
      // AlimTalk features
      'templates',
      'messaging',
      'channels',
      'analytics',
      'account',
      'scheduling',
      'fallback',
      'business_verification',
      // SMS features
      'sms',
      'lms',
      'bulk_sms',
      'sms_scheduling',
      'sender_numbers',
      'sender_verification',
      'sms_status_tracking'
    ];
  }

  public getConfigurationSchema(): ConfigurationSchema {
    return {
      required: [
        {
          key: 'apiKey',
          type: 'secret',
          description: 'IWINV API key for both AlimTalk and SMS',
          validation: {
            min: 4
          }
        }
      ],
      optional: [
        {
          key: 'baseUrl',
          type: 'url',
          description: 'IWINV API base URL',
          validation: {
            pattern: '^https?://.+'
          }
        },
        {
          key: 'smsBaseUrl',
          type: 'url',
          description: 'IWINV SMS API base URL (if different)',
          validation: {
            pattern: '^https?://.+'
          }
        },
        {
          key: 'debug',
          type: 'boolean',
          description: 'Enable debug logging'
        }
      ]
    };
  }

  // 기존 호환성 메서드들
  public getProviderConfiguration(): ProviderConfiguration {
    return {
      required: [
        {
          key: 'apiKey',
          name: 'API Key',
          type: 'password',
          description: 'IWINV API key for authentication',
          required: true,
          validation: {
            min: 4
          }
        }
      ],
      optional: [
        {
          key: 'baseUrl',
          name: 'Base URL',
          type: 'url',
          description: 'IWINV API base URL',
          required: false,
          default: 'https://alimtalk.bizservice.iwinv.kr',
          validation: {
            pattern: '^https?://.+'
          }
        },
        {
          key: 'smsBaseUrl',
          name: 'SMS Base URL',
          type: 'url',
          description: 'IWINV SMS API base URL',
          required: false,
          default: 'https://sms.bizservice.iwinv.kr'
        },
        {
          key: 'debug',
          name: 'Debug Mode',
          type: 'boolean',
          description: 'Enable debug logging',
          required: false,
          default: false
        }
      ]
    };
  }

  protected async testConnectivity(): Promise<void> {
    const config = this.getIWINVConfig();

    try {
      // AlimTalk 연결 테스트
      const alimTalkResponse = await fetch(`${config.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'AUTH': btoa(config.apiKey)
        }
      });

      if (!alimTalkResponse.ok) {
        throw new Error(`AlimTalk connectivity test failed: ${alimTalkResponse.status}`);
      }

      // SMS 연결 테스트
      const smsBaseUrl = this.getConfig<string>('smsBaseUrl') || 'https://sms.bizservice.iwinv.kr';
      const smsResponse = await fetch(`${smsBaseUrl}/balance`, {
        method: 'GET',
        headers: {
          'AUTH': btoa(config.apiKey)
        }
      });

      if (!smsResponse.ok) {
        throw new Error(`SMS connectivity test failed: ${smsResponse.status}`);
      }
    } catch (error) {
      throw new Error(`Multi-provider connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async testAuthentication(): Promise<void> {
    // AlimTalk 및 SMS 인증 테스트는 testConnectivity에서 함께 수행
    await this.testConnectivity();
  }

  protected getVersion(): string {
    return '1.0.0';
  }

  // Helper methods
  private mapMessageStatusToDeliveryStatus(status: MessageStatus): DeliveryStatus {
    const statusMapping: Record<MessageStatus, 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled'> = {
      [MessageStatus.QUEUED]: 'pending',
      [MessageStatus.SENDING]: 'sent',
      [MessageStatus.SENT]: 'sent',
      [MessageStatus.DELIVERED]: 'delivered',
      [MessageStatus.FAILED]: 'failed',
      [MessageStatus.CANCELLED]: 'cancelled'
    };

    return {
      status: statusMapping[status] || 'failed',
      timestamp: new Date()
    };
  }

  private isAlimTalkRequest(request: IWINVRequest): request is AlimTalkRequest {
    return 'templateCode' in request;
  }

  private isSMSRequest(request: IWINVRequest): request is SMSRequest {
    return 'text' in request && !('templateCode' in request);
  }

  private getIWINVConfig(): IWINVConfig {
    return {
      apiKey: this.getConfig<string>('apiKey'),
      baseUrl: this.getConfig<string>('baseUrl') || 'https://alimtalk.bizservice.iwinv.kr',
      debug: this.getConfig<boolean>('debug') || false
    };
  }

  // Multi-provider 전용 메서드들
  public getMultiCapabilities(): MultiProviderCapabilities {
    return {
      alimtalk: this.capabilities,
      sms: this.smsCapabilities
    };
  }

  public getSupportedTypes(): ProviderType[] {
    return ['messaging', 'sms'];
  }
}