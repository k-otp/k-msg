/**
 * IWINV Message Service - IWINV Provider 전용 메시징 서비스
 */

import { BaseMessageService, type MessageServiceConfig } from './base-message.service';
import type { IWINVProvider } from '@k-msg/provider';

export interface IWINVMessageServiceConfig extends Omit<MessageServiceConfig, 'provider'> {
  provider: IWINVProvider;
  iwinvSpecific?: {
    templateCategories?: string[];
    maxVariables?: number;
    enableBulkSending?: boolean;
  };
}

export class IWINVMessageService extends BaseMessageService {
  private iwinvProvider: IWINVProvider;

  constructor(config: IWINVMessageServiceConfig) {
    // IWINV 특화 설정을 기본값과 병합
    const mergedConfig: MessageServiceConfig = {
      ...config,
      loadOptions: {
        channels: true,
        templates: true,
        analytics: false,
        ...config.loadOptions
      }
    };

    super(mergedConfig);
    this.iwinvProvider = config.provider;
  }

  // === IWINV 특화 채널 로더 ===
  protected async defaultChannelLoader(): Promise<any[]> {
    try {
      // IWINV는 채널 API가 없으므로 기본 채널 반환
      const channels = await this.iwinvProvider.channels.list();
      return Array.isArray(channels) ? channels : [];
    } catch (error) {
      // IWINV 채널 API 실패 시 기본 채널 사용
      return [{
        id: 'iwinv-default',
        name: 'IWINV Default Channel',
        profileKey: 'default',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }];
    }
  }

  // === IWINV 특화 템플릿 로더 ===
  protected async defaultTemplateLoader(): Promise<any[]> {
    try {
      const templates = await this.iwinvProvider.templates.list();
      return Array.isArray(templates) ? templates : [];
    } catch (error) {
      console.warn('IWINV template loading failed, falling back to empty list');
      return [];
    }
  }

  // === 템플릿 생성 (IWINV 특화) ===
  async createTemplate(name: string, content: string, category: string) {
    try {
      // 1. 템플릿 변수 자동 파싱
      const variables = this.parseTemplateVariables(content);
      
      // 2. 로컬 저장
      const template = {
        id: `template_${Date.now()}`,
        name,
        content,
        category,
        variables,
        status: 'created',
        createdAt: new Date().toISOString()
      };
      
      this.state.localTemplates.set(name, template);

      // 3. IWINV Provider에도 등록 시도
      try {
        await this.iwinvProvider.createTemplate(name, content, category, variables);
        console.log(`✅ Template '${name}' created in IWINV provider`);
        template.status = 'submitted';
      } catch (providerError) {
        console.warn('IWINV template creation failed:', providerError);
        template.status = 'local_only';
      }

      return {
        success: true,
        template
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template creation failed'
      };
    }
  }

  // === 메시지 발송 (IWINV 특화) ===
  async sendMessage(phoneNumber: string, templateName: string, variables: Record<string, any>) {
    try {
      // 1. IWINV 메시지 발송 요청
      const result = await this.iwinvProvider.sendMessage({
        templateCode: templateName,
        phoneNumber,
        variables
      });

      // 2. 로컬 메시지 로그 저장
      const messageLog = {
        id: `msg_${Date.now()}`,
        phoneNumber,
        templateName,
        variables,
        result,
        sentAt: new Date().toISOString()
      };
      this.state.messages.push(messageLog);

      return {
        success: !!result.messageId,
        messageId: result.messageId,
        status: result.messageId ? 'sent' : 'failed',
        error: result.messageId ? undefined : result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Message send failed'
      };
    }
  }

  // === IWINV 특화 Analytics ===
  async getAnalytics() {
    try {
      const totalMessages = this.state.messages.length;
      const successfulMessages = this.state.messages.filter(m => m.result.messageId).length;
      const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;

      return {
        success: true,
        analytics: {
          messagesSent: totalMessages,
          successfulMessages,
          successRate: Math.round(successRate * 100) / 100,
          templates: this.state.localTemplates.size,
          providerTemplates: this.state.providerTemplates.length,
          totalTemplates: this.state.localTemplates.size + this.state.providerTemplates.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics unavailable'
      };
    }
  }

  // === IWINV 특화 유틸리티 ===
  async getIWINVBalance() {
    try {
      const balance = await this.iwinvProvider.account.getBalance();
      return balance;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Balance check failed'
      };
    }
  }

  async getIWINVHistory(page: number = 1, size: number = 20) {
    try {
      // 로컬 메시지 이력 반환 (실제 구현에서는 provider의 history API 사용)
      const recentMessages = this.state.messages
        .slice(-size * page)
        .slice(-(size));

      return {
        success: true,
        data: {
          messages: recentMessages,
          pagination: {
            page,
            size,
            total: this.state.messages.length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'History fetch failed'
      };
    }
  }
}