/**
 * IWINV Messaging Contract Implementation
 */

import {
  MessageStatus,
  type MessagingContract,
  type ProviderBulkResult,
  type ProviderMessageRequest,
  type ProviderMessageResult,
  type ScheduleResult,
} from "../../contracts/provider.contract";

import type { IWINVConfig } from "../types/iwinv";

export class IWINVMessagingContract implements MessagingContract {
  constructor(private config: IWINVConfig) {}

  async send(message: ProviderMessageRequest): Promise<ProviderMessageResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          AUTH: btoa(this.config.apiKey),
        },
        body: JSON.stringify({
          templateCode: message.templateCode,
          phone: message.phoneNumber,
          variables: message.variables,
          senderNumber: message.senderNumber,
          ...message.options,
        }),
      });

      const result = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        return {
          messageId: `failed_${Date.now()}`,
          status: MessageStatus.FAILED,
          error: {
            code: (result.code as string as string) || "SEND_FAILED",
            message:
              (result.message as string as string) || "Failed to send message",
            retryable: response.status >= 500,
          },
        };
      }

      return {
        messageId:
          (result.messageId as string as string) || `msg_${Date.now()}`,
        status: MessageStatus.SENT,
        sentAt: new Date(),
      };
    } catch (error) {
      return {
        messageId: `error_${Date.now()}`,
        status: MessageStatus.FAILED,
        error: {
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          retryable: true,
        },
      };
    }
  }

  async sendBulk(
    messages: ProviderMessageRequest[],
  ): Promise<ProviderBulkResult> {
    const results: ProviderMessageResult[] = [];

    // IWINV doesn't have native bulk API, so send individually
    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    const sent = results.filter((r) => r.status === MessageStatus.SENT).length;
    const failed = results.filter(
      (r) => r.status === MessageStatus.FAILED,
    ).length;

    return {
      requestId: `bulk_${Date.now()}`,
      results,
      summary: {
        total: messages.length,
        sent,
        failed,
      },
    };
  }

  async schedule(
    message: ProviderMessageRequest,
    scheduledAt: Date,
  ): Promise<ScheduleResult> {
    // Implementation for scheduled sending
    // For now, return a mock implementation
    return {
      scheduleId: `schedule_${Date.now()}`,
      messageId: `msg_${Date.now()}`,
      scheduledAt,
      status: "scheduled",
    };
  }

  async cancel(messageId: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ messageId }),
    });

    if (!response.ok) {
      const result = (await response.json()) as Record<string, unknown>;
      throw new Error(`Failed to cancel message: ${result.message as string}`);
    }
  }

  async getStatus(messageId: string): Promise<MessageStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          AUTH: btoa(this.config.apiKey),
        },
        body: JSON.stringify({ messageId }),
      });

      const result = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        return MessageStatus.FAILED;
      }

      // Map IWINV status to our MessageStatus
      switch (result.statusCode as string) {
        case "OK":
          return MessageStatus.DELIVERED;
        case "PENDING":
          return MessageStatus.SENDING;
        case "FAILED":
          return MessageStatus.FAILED;
        default:
          return MessageStatus.SENT;
      }
    } catch (error) {
      return MessageStatus.FAILED;
    }
  }
}
