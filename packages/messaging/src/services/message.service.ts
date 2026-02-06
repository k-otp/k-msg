import type { ProviderService } from '@k-msg/provider';
import type { MessageSendOptions, MessageSendResult } from '@k-msg/core';

/**
 * A high-level service for orchestrating message sending.
 * It uses the ProviderService to select the appropriate provider and sends messages.
 */
export class MessageService {
  /**
   * @param providerService An instance of ProviderService to resolve messaging providers.
   */
  constructor(private providerService: ProviderService) { }

  /**
   * Sends messages to multiple recipients using the default provider.
   * This method encapsulates the logic of iterating through recipients and calling the provider.
   * @param options The message sending options.
   * @returns A result object with a summary and individual results.
   */
  async send(options: MessageSendOptions): Promise<MessageSendResult> {
    const provider = this.providerService.getDefault() as any;
    if (!provider || (!provider.sendMessage && !provider.send)) {
      throw new Error('A default provider with sendMessage capability is not configured.');
    }

    const results = [];
    const summary = { total: options.recipients.length, sent: 0, failed: 0 };

    for (const recipient of options.recipients) {
      try {
        const mergedVariables = { ...options.variables, ...recipient.variables };
        const result = provider.sendMessage 
          ? await provider.sendMessage(
              options.templateId,
              recipient.phoneNumber,
              mergedVariables
            )
          : await provider.send({
              templateCode: options.templateId,
              phoneNumber: recipient.phoneNumber,
              variables: mergedVariables
            });

        if (result.success) {
          summary.sent++;
          results.push({
            messageId: result.messageId,
            status: result.status || 'SENT',
            phoneNumber: recipient.phoneNumber,
          });
        } else {
          summary.failed++;
          results.push({
            phoneNumber: recipient.phoneNumber,
            status: 'FAILED',
            error: { message: result.error?.message || result.error || 'Provider reported a failure' },
          });
        }
      } catch (error) {
        summary.failed++;
        results.push({
          phoneNumber: recipient.phoneNumber,
          status: 'FAILED',
          error: { message: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    return { results, summary };
  }
}
