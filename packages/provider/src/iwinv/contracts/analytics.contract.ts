/**
 * IWINV Analytics Contract Implementation
 */

import {
  AnalyticsContract,
  DateRange,
  UsageStats,
  TemplateStats,
  DeliveryReport,
  MessageStatus
} from '../../contracts/provider.contract';

import { IWINVConfig } from '../types/iwinv';

// Message types for analytics
interface IWINVMessageRecord {
  seqNo: number;
  phone: string;
  templateCode: string;
  statusCode: string;
  statusCodeName: string;
  requestDate: string;
  sendDate?: string;
  receiveDate?: string;
  sendMessage: string;
}

export class IWINVAnalyticsContract implements AnalyticsContract {
  constructor(private config: IWINVConfig) {}

  async getUsage(period: DateRange): Promise<UsageStats> {
    try {
      const response = await fetch(`${this.config.baseUrl}/history/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AUTH': btoa(this.config.apiKey)
        },
        body: JSON.stringify({
          startDate: period.from.toISOString(),
          endDate: period.to.toISOString(),
          page: 1,
          size: 1000
        })
      });

      const result = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(`Failed to get usage stats: ${(result.message as string)}`);
      }

      const messages = (result.list as IWINVMessageRecord[]) || [];
      const totalMessages = messages.length;
      const deliveredMessages = messages.filter((msg: IWINVMessageRecord) => msg.statusCode === 'OK').length;
      const failedMessages = messages.filter((msg: IWINVMessageRecord) => msg.statusCode === 'FAILED').length;
      const sentMessages = totalMessages - failedMessages;

      return {
        period,
        totalMessages,
        sentMessages,
        deliveredMessages,
        failedMessages,
        deliveryRate: totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0,
        failureRate: totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0,
        breakdown: {
          byTemplate: this.groupByTemplate(messages),
          byDay: this.groupByDay(messages, period),
          byHour: this.groupByHour(messages)
        }
      };
    } catch (error) {
      // Return empty stats if API fails
      return {
        period,
        totalMessages: 0,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        deliveryRate: 0,
        failureRate: 0,
        breakdown: {
          byTemplate: {},
          byDay: {},
          byHour: {}
        }
      };
    }
  }

  async getTemplateStats(templateId: string, period: DateRange): Promise<TemplateStats> {
    try {
      const usage = await this.getUsage(period);
      const templateMessages = usage.breakdown.byTemplate[templateId] || 0;

      return {
        templateId,
        period,
        totalSent: templateMessages,
        delivered: Math.round(templateMessages * (usage.deliveryRate / 100)),
        failed: Math.round(templateMessages * (usage.failureRate / 100)),
        deliveryRate: usage.deliveryRate,
        averageDeliveryTime: 30 // Mock average delivery time in seconds
      };
    } catch (error) {
      return {
        templateId,
        period,
        totalSent: 0,
        delivered: 0,
        failed: 0,
        deliveryRate: 0,
        averageDeliveryTime: 0
      };
    }
  }

  async getDeliveryReport(messageId: string): Promise<DeliveryReport> {
    try {
      const response = await fetch(`${this.config.baseUrl}/history/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AUTH': btoa(this.config.apiKey)
        },
        body: JSON.stringify({
          messageId: parseInt(messageId) || 0
        })
      });

      const result = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(`Failed to get delivery report: ${(result.message as string)}`);
      }

      return {
        messageId,
        phoneNumber: (result.phone as string) || 'unknown',
        templateCode: (result.templateCode as string) || 'unknown',
        status: this.mapStatus((result.statusCode as string)),
        sentAt: (result.sendDate as string) ? new Date((result.sendDate as string)) : undefined,
        deliveredAt: (result.receiveDate as string) ? new Date((result.receiveDate as string)) : undefined,
        failedAt: (result.statusCode as string) === 'FAILED' ? new Date((result.sendDate as string)) : undefined,
        clickedAt: (result.clickedAt as string) ? new Date((result.clickedAt as string)) : undefined,
        error: (result.statusCode as string) !== 'OK' ? {
          code: (result.statusCode as string),
          message: (result.statusCodeName as string)
        } : undefined,
        attempts: [
          {
            attemptNumber: 1,
            attemptedAt: new Date((result.requestDate as string)),
            status: this.mapStatus((result.statusCode as string)),
            error: (result.statusCode as string) !== 'OK' ? {
              code: (result.statusCode as string),
              message: (result.statusCodeName as string)
            } : undefined
          }
        ]
      };
    } catch (error) {
      return {
        messageId,
        phoneNumber: 'unknown',
        templateCode: 'unknown', 
        status: 'FAILED' as any,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        attempts: []
      };
    }
  }

  private groupByTemplate(messages: IWINVMessageRecord[]): Record<string, number> {
    const groups: Record<string, number> = {};
    messages.forEach(msg => {
      const template = msg.templateCode || 'unknown';
      groups[template] = (groups[template] || 0) + 1;
    });
    return groups;
  }

  private groupByDay(messages: IWINVMessageRecord[], period: DateRange): Record<string, number> {
    const groups: Record<string, number> = {};
    const current = new Date(period.from);
    
    while (current <= period.to) {
      const dateKey = current.toISOString().split('T')[0];
      groups[dateKey] = 0;
      current.setDate(current.getDate() + 1);
    }

    messages.forEach(msg => {
      if (msg.requestDate) {
        const dateKey = new Date(msg.requestDate).toISOString().split('T')[0];
        if (groups.hasOwnProperty(dateKey)) {
          groups[dateKey]++;
        }
      }
    });

    return groups;
  }

  private groupByHour(messages: IWINVMessageRecord[]): Record<string, number> {
    const groups: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      groups[i.toString()] = 0;
    }

    messages.forEach(msg => {
      if (msg.requestDate) {
        const hour = new Date(msg.requestDate).getHours();
        groups[hour.toString()]++;
      }
    });

    return groups;
  }

  private mapStatus(statusCode: string): MessageStatus {
    switch (statusCode) {
      case 'OK':
        return MessageStatus.DELIVERED;
      case 'PENDING':
        return MessageStatus.SENDING;
      case 'FAILED':
        return MessageStatus.FAILED;
      default:
        return MessageStatus.SENT;
    }
  }
}