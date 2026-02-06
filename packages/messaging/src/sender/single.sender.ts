import {
  MessageRequest,
  MessageResult,
  RecipientResult,
  MessageStatus,
  DeliveryReport,
  DeliveryAttempt
} from '../types/message.types';

export interface Provider {
  id: string;
  name: string;
  send(request: ProviderMessageRequest): Promise<ProviderMessageResult>;
  cancelMessage?(messageId: string): Promise<boolean>;
  getMessageStatus?(messageId: string): Promise<MessageStatus>;
}

export interface ProviderMessageRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, any>;
  options?: Record<string, any>;
}

export interface ProviderMessageResult {
  messageId: string;
  status: MessageStatus;
  error?: { code: string; message: string };
}

export class SingleMessageSender {
  private providers: Map<string, Provider> = new Map();
  private templates: Map<string, any> = new Map(); // Template cache
  private messageStore: Map<string, DeliveryReport> = new Map(); // Message tracking store
  private scheduledMessages: Map<string, { request: MessageRequest; scheduledAt: Date }> = new Map();

  addProvider(provider: Provider): void {
    this.providers.set(provider.id, provider);
  }

  removeProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  async send(request: MessageRequest): Promise<MessageResult> {
    const requestId = this.generateRequestId();
    const results: RecipientResult[] = [];

    // Get template information
    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new Error(`Template ${request.templateId} not found`);
    }

    // Get provider
    const provider = this.providers.get(template.provider);
    if (!provider) {
      throw new Error(`Provider ${template.provider} not found`);
    }

    // Process each recipient
    for (const recipient of request.recipients) {
      try {
        const result = await this.sendToRecipient(
          provider,
          template,
          recipient,
          request.variables,
          request.options
        );
        results.push(result);
      } catch (error) {
        results.push({
          phoneNumber: recipient.phoneNumber,
          status: MessageStatus.FAILED,
          error: {
            code: 'SEND_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          metadata: recipient.metadata
        });
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(results);

    return {
      requestId,
      results,
      summary,
      metadata: {
        createdAt: new Date(),
        provider: template.provider,
        templateId: request.templateId
      }
    };
  }

  private async sendToRecipient(
    provider: Provider,
    template: any,
    recipient: any,
    commonVariables: Record<string, any>,
    options?: any
  ): Promise<RecipientResult> {
    // Merge common variables with recipient-specific variables
    const variables = { ...commonVariables, ...recipient.variables };

    // Note: Variable parsing moved to personalization system
    // Variables are now handled by VariableReplacer in the personalization package

    // Prepare provider request
    const providerRequest: ProviderMessageRequest = {
      templateCode: template.code,
      phoneNumber: recipient.phoneNumber,
      variables,
      options
    };

    // Send message
    const providerResult = await provider.send(providerRequest);

    // Store delivery report for tracking
    if (providerResult.messageId) {
      const deliveryReport: DeliveryReport = {
        messageId: providerResult.messageId,
        phoneNumber: recipient.phoneNumber,
        status: providerResult.status,
        sentAt: providerResult.status === MessageStatus.SENT ? new Date() : undefined,
        attempts: [{
          attemptNumber: 1,
          attemptedAt: new Date(),
          status: providerResult.status,
          error: providerResult.error,
          provider: provider.id
        }],
        metadata: {
          templateCode: template.code,
          requestVariables: variables,
          ...recipient.metadata
        }
      };
      this.messageStore.set(providerResult.messageId, deliveryReport);
    }

    return {
      phoneNumber: recipient.phoneNumber,
      messageId: providerResult.messageId,
      status: providerResult.status,
      error: providerResult.error,
      metadata: recipient.metadata
    };
  }

  private async getTemplate(templateId: string): Promise<any> {
    // Check cache first
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId);
    }

    // In a real implementation, this would fetch from a database
    // For now, return a mock template
    const template = {
      id: templateId,
      code: 'TEMPLATE_CODE',
      provider: 'mock-provider',
      variables: [],
      content: 'Mock template content'
    };

    this.templates.set(templateId, template);
    return template;
  }

  private calculateSummary(results: RecipientResult[]) {
    return {
      total: results.length,
      queued: results.filter(r => r.status === MessageStatus.QUEUED).length,
      sent: results.filter(r => r.status === MessageStatus.SENT).length,
      failed: results.filter(r => r.status === MessageStatus.FAILED).length
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getProviderForMessage(deliveryReport: DeliveryReport): Provider | undefined {
    // Find provider from the latest attempt
    const latestAttempt = deliveryReport.attempts[deliveryReport.attempts.length - 1];
    return this.providers.get(latestAttempt.provider);
  }

  /**
   * Get delivery report for a message
   */
  getDeliveryReport(messageId: string): DeliveryReport | undefined {
    return this.messageStore.get(messageId);
  }

  /**
   * Get all delivery reports (for debugging/monitoring)
   */
  getAllDeliveryReports(): DeliveryReport[] {
    return Array.from(this.messageStore.values());
  }

  /**
   * Clean up old delivery reports to prevent memory leaks
   */
  cleanupOldReports(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let removedCount = 0;
    for (const [messageId, report] of this.messageStore.entries()) {
      const reportDate = report.sentAt || report.attempts[0]?.attemptedAt;
      if (reportDate && reportDate < cutoffDate) {
        this.messageStore.delete(messageId);
        removedCount++;
      }
    }

    return removedCount;
  }

  async cancelMessage(messageId: string): Promise<boolean> {
    // Check if message exists in our tracking store
    const deliveryReport = this.messageStore.get(messageId);
    if (!deliveryReport) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Cannot cancel already delivered or failed messages
    if (deliveryReport.status === MessageStatus.DELIVERED ||
        deliveryReport.status === MessageStatus.FAILED ||
        deliveryReport.status === MessageStatus.CANCELLED) {
      return false;
    }

    // Try to cancel with provider if supported
    const provider = this.getProviderForMessage(deliveryReport);
    if (provider?.cancelMessage) {
      try {
        const cancelled = await provider.cancelMessage(messageId);
        if (cancelled) {
          // Update our tracking store
          deliveryReport.status = MessageStatus.CANCELLED;
          deliveryReport.failedAt = new Date();
          this.messageStore.set(messageId, deliveryReport);
          return true;
        }
      } catch (error) {
        // Provider cancellation failed, but we can still mark as cancelled locally
        console.warn(`Provider cancellation failed for ${messageId}:`, error);
      }
    }

    // Check if it's a scheduled message we can cancel
    const scheduledMessage = Array.from(this.scheduledMessages.entries())
      .find(([_, data]) => data.request.templateId &&
        data.request.recipients.some(r => r.metadata?.messageId === messageId));

    if (scheduledMessage) {
      this.scheduledMessages.delete(scheduledMessage[0]);
      deliveryReport.status = MessageStatus.CANCELLED;
      deliveryReport.failedAt = new Date();
      this.messageStore.set(messageId, deliveryReport);
      return true;
    }

    // For sent messages, mark as cancelled but cannot guarantee provider cancellation
    deliveryReport.status = MessageStatus.CANCELLED;
    deliveryReport.failedAt = new Date();
    this.messageStore.set(messageId, deliveryReport);
    return true;
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    // Check our local tracking store first
    const deliveryReport = this.messageStore.get(messageId);
    if (!deliveryReport) {
      throw new Error(`Message ${messageId} not found`);
    }

    // If message is final state, return cached status
    if (deliveryReport.status === MessageStatus.DELIVERED ||
        deliveryReport.status === MessageStatus.FAILED ||
        deliveryReport.status === MessageStatus.CANCELLED) {
      return deliveryReport.status;
    }

    // Try to get updated status from provider if supported
    const provider = this.getProviderForMessage(deliveryReport);
    if (provider?.getMessageStatus) {
      try {
        const updatedStatus = await provider.getMessageStatus(messageId);

        // Update our tracking store with latest status
        deliveryReport.status = updatedStatus;

        // Update timestamps based on status
        if (updatedStatus === MessageStatus.DELIVERED && !deliveryReport.deliveredAt) {
          deliveryReport.deliveredAt = new Date();
        } else if (updatedStatus === MessageStatus.FAILED && !deliveryReport.failedAt) {
          deliveryReport.failedAt = new Date();
        }

        this.messageStore.set(messageId, deliveryReport);
        return updatedStatus;
      } catch (error) {
        console.warn(`Failed to get status from provider for ${messageId}:`, error);
        // Return cached status if provider query fails
        return deliveryReport.status;
      }
    }

    // Return cached status if provider doesn't support status checking
    return deliveryReport.status;
  }

  async resendMessage(messageId: string, options?: { newRecipient?: string }): Promise<MessageResult> {
    // Get original message details
    const deliveryReport = this.messageStore.get(messageId);
    if (!deliveryReport) {
      throw new Error(`Message ${messageId} not found`);
    }

    // Only allow resending of failed or cancelled messages
    if (deliveryReport.status !== MessageStatus.FAILED &&
        deliveryReport.status !== MessageStatus.CANCELLED) {
      throw new Error(`Cannot resend message ${messageId} with status ${deliveryReport.status}`);
    }

    // Reconstruct the original request
    const originalVariables = deliveryReport.metadata.requestVariables as Record<string, any> || {};
    const templateCode = deliveryReport.metadata.templateCode as string;

    // Use new recipient if provided, otherwise use original
    const phoneNumber = options?.newRecipient || deliveryReport.phoneNumber;

    // Get template and provider
    const template = await this.getTemplate(templateCode);
    if (!template) {
      throw new Error(`Template ${templateCode} not found for resend`);
    }

    const provider = this.providers.get(template.provider);
    if (!provider) {
      throw new Error(`Provider ${template.provider} not found for resend`);
    }

    // Create new message request
    const resendRequest: MessageRequest = {
      templateId: template.id,
      recipients: [{
        phoneNumber,
        variables: originalVariables,
        metadata: {
          originalMessageId: messageId,
          resendAttempt: true,
          resendTimestamp: new Date().toISOString()
        }
      }],
      variables: {}
    };

    try {
      // Send the resend request
      const result = await this.send(resendRequest);

      // Update original delivery report to mark as resent
      const attemptNumber = deliveryReport.attempts.length + 1;
      deliveryReport.attempts.push({
        attemptNumber,
        attemptedAt: new Date(),
        status: result.results[0]?.status || MessageStatus.FAILED,
        error: result.results[0]?.error,
        provider: provider.id
      });

      // Update delivery report with resend info
      deliveryReport.metadata.resendCount = (deliveryReport.metadata.resendCount as number || 0) + 1;
      deliveryReport.metadata.lastResendAt = new Date().toISOString();

      if (result.results[0]?.messageId) {
        deliveryReport.metadata.resendMessageIds = [
          ...(deliveryReport.metadata.resendMessageIds as string[] || []),
          result.results[0].messageId
        ];
      }

      this.messageStore.set(messageId, deliveryReport);

      return result;
    } catch (error) {
      // Record failed resend attempt
      const attemptNumber = deliveryReport.attempts.length + 1;
      deliveryReport.attempts.push({
        attemptNumber,
        attemptedAt: new Date(),
        status: MessageStatus.FAILED,
        error: {
          code: 'RESEND_FAILED',
          message: error instanceof Error ? error.message : 'Unknown resend error'
        },
        provider: provider.id
      });

      this.messageStore.set(messageId, deliveryReport);
      throw error;
    }
  }
}