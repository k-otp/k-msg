import { IWINVProvider } from '@k-msg/provider';

/**
 * Simple message sender for CLI/scripts
 * 
 * @example
 * ```typescript
 * import { createKMsgSender } from 'k-msg/modules';
 * 
 * const sender = createKMsgSender({
 *   iwinvApiKey: process.env.IWINV_API_KEY!
 * });
 * 
 * // User defines their own templates and variables
 * await sender.sendMessage('01012345678', 'USER_OTP_TEMPLATE', { 
 *   code: '123456',
 *   serviceName: 'MyApp',
 *   expireMinutes: 3
 * });
 * ```
 */
export function createKMsgSender(config: {
  iwinvApiKey: string;
  iwinvBaseUrl?: string;
}) {
  const provider = new IWINVProvider({
    apiKey: config.iwinvApiKey,
    baseUrl: config.iwinvBaseUrl || 'https://alimtalk.bizservice.iwinv.kr',
    debug: false
  });

  return {
    /**
     * Send message with custom template and variables
     * User defines their own template structure
     */
    async sendMessage(phoneNumber: string, templateCode: string, variables: Record<string, any>) {
      try {
        const result = await provider.sendMessage({
          templateCode,
          phoneNumber,
          variables
        });

        if (!result.messageId) {
          // Handle provider-level failure (e.g., invalid template, etc.)
          const error = result.error;
          const errorMessage = error instanceof Error ? error.message :
            typeof error === 'string' ? error :
              'Provider reported a failure';
          throw new Error(errorMessage);
        }

        return {
          messageId: result.messageId,
          status: 'SENT' as const,
          templateCode,
          phoneNumber,
          variables,
          error: null,
          sentAt: new Date().toISOString()
        };
      } catch (error) {
        return {
          messageId: null,
          status: 'FAILED' as const,
          templateCode,
          phoneNumber,
          variables,
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date().toISOString()
        };
      }
    },

    /**
     * Send bulk messages with user-defined template
     */
    async sendBulk(recipients: Array<{
      phoneNumber: string;
      variables: Record<string, any>;
    }>, templateCode: string, options?: {
      batchSize?: number;
      batchDelay?: number;
    }) {
      const batchId = `batch_${Date.now()}`;
      const batchSize = options?.batchSize || 10;
      const batchDelay = options?.batchDelay || 1000;

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      // Process recipients in batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        // Process batch concurrently
        const batchPromises = batch.map(async (recipient) => {
          try {
            const result = await provider.sendMessage({
              templateCode,
              phoneNumber: recipient.phoneNumber,
              variables: recipient.variables
            });

            if (result.messageId) {
              successCount++;
              return {
                messageId: result.messageId,
                phoneNumber: recipient.phoneNumber,
                status: 'SENT' as const,
                variables: recipient.variables,
                error: null
              };
            } else {
              failureCount++;
              return {
                messageId: null,
                phoneNumber: recipient.phoneNumber,
                status: 'FAILED' as const,
                variables: recipient.variables,
                error: result.error?.message || 'Unknown error'
              };
            }
          } catch (error) {
            failureCount++;
            return {
              messageId: null,
              phoneNumber: recipient.phoneNumber,
              status: 'FAILED' as const,
              variables: recipient.variables,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches (except for the last batch)
        if (i + batchSize < recipients.length && batchDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
      }

      return {
        batchId,
        templateCode,
        totalCount: recipients.length,
        successCount,
        failureCount,
        processedAt: new Date().toISOString(),
        results
      };
    },

    /**
     * Check message delivery status
     */
    async getStatus(messageId: string) {
      try {
        const status = await provider.messaging.getStatus(messageId);

        return {
          messageId,
          status: status,
          checkedAt: new Date().toISOString(),
          deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : undefined,
          failedAt: status === 'FAILED' ? new Date().toISOString() : undefined
        };
      } catch (error) {
        return {
          messageId,
          status: 'UNKNOWN',
          error: error instanceof Error ? error.message : 'Failed to check status',
          checkedAt: new Date().toISOString()
        };
      }
    }

    /**
     * Get platform instance for advanced usage (when implemented)
     */
    // getPlatform: () => platform
  };
}

/**
 * Template manager for CLI/scripts
 * 
 * @example
 * ```typescript
 * const templates = createKMsgTemplates({ ... });
 * await templates.create('user_welcome', 'Welcome #{name}! Your account #{accountId} is ready.');
 * ```
 */
export function createKMsgTemplates(config: {
  iwinvApiKey: string;
  iwinvBaseUrl?: string;
}) {
  const provider = new IWINVProvider({
    apiKey: config.iwinvApiKey,
    baseUrl: config.iwinvBaseUrl || 'https://alimtalk.bizservice.iwinv.kr',
    debug: false
  });

  return {
    /**
     * Create template with user-defined structure
     */
    async create(templateCode: string, content: string, description: string) {
      try {
        // Parse variables from template content
        const variables = this.parseVariables(content);

        const result = await provider.createTemplate(
          templateCode,
          content,
          variables
        );

        return {
          id: result.templateId,
          code: result.providerTemplateCode,
          content,
          description,
          variables,
          status: result.status,
          message: result.message,
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        return {
          id: null,
          code: templateCode,
          content,
          description,
          variables: this.parseVariables(content),
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          createdAt: new Date().toISOString()
        };
      }
    },

    /**
     * List user templates
     */
    async list(filters?: { status?: string }) {
      try {
        const templates = await provider.templates.list();
        return templates.filter(
          template => !filters?.status || template.status === filters.status
        );
      } catch (error) {
        console.warn('Failed to list templates:', error);
        return [];
      }
    },

    /**
     * Validate template syntax and extract variables
     */
    async validate(content: string) {
      const variables = this.parseVariables(content);
      const errors: string[] = [];

      // Basic validation
      if (content.length === 0) {
        errors.push('Template content cannot be empty');
      }

      if (content.length > 1000) {
        errors.push('Template content too long (max 1000 chars)');
      }

      return {
        isValid: errors.length === 0,
        errors,
        variables
      };
    },

    /**
     * Parse variables from template content
     */
    parseVariables(content: string) {
      const matches = content.match(/#{([^}]+)}/g) || [];
      // Use a Set to efficiently get unique variable names
      const uniqueNames = new Set(matches.map(match => match.slice(2, -1)));

      return Array.from(uniqueNames).map(name => ({
        name,
        type: 'string',
        required: true
      }));
    },

    /**
     * Test template with sample variables
     */
    async test(templateCode: string, sampleVariables: Record<string, any>) {
      try {
        // Get template details first
        const templates = await provider.templates.list();
        const template = templates.find(t => t.code === templateCode);

        if (!template) {
          throw new Error(`Template ${templateCode} not found`);
        }

        // Parse variables from template content
        const requiredVariables = this.parseVariables(template.content);
        const missingVariables = requiredVariables
          .filter(v => v.required && !(v.name in sampleVariables))
          .map(v => v.name);

        if (missingVariables.length > 0) {
          return {
            templateCode,
            renderedContent: null,
            isValid: false,
            errors: [`Missing required variables: ${missingVariables.join(', ')}`]
          };
        }

        // Render template with sample variables
        let renderedContent = template.content;
        for (const [key, value] of Object.entries(sampleVariables)) {
          const regex = new RegExp(`#{${key}}`, 'g');
          renderedContent = renderedContent.replace(regex, String(value));
        }

        // Check for unreplaced variables
        const unreplacedVars = renderedContent.match(/#{([^}]+)}/g);
        const warnings = unreplacedVars ?
          [`Unreplaced variables found: ${unreplacedVars.join(', ')}`] : [];

        return {
          templateCode,
          renderedContent,
          isValid: !unreplacedVars,
          warnings
        };
      } catch (error) {
        return {
          templateCode,
          renderedContent: null,
          isValid: false,
          error: error instanceof Error ? error.message : 'Template test failed'
        };
      }
    }
  };
}

/**
 * Analytics reader for scripts/reporting
 */
export function createKMsgAnalytics(config: {
  iwinvApiKey: string;
  iwinvBaseUrl?: string;
}) {
  const provider = new IWINVProvider({
    apiKey: config.iwinvApiKey,
    baseUrl: config.iwinvBaseUrl || 'https://alimtalk.bizservice.iwinv.kr',
    debug: false
  });

  return {
    /**
     * Get message statistics for specified period
     */
    async getMessageStats(period: 'day' | 'week' | 'month' = 'day') {
      try {
        const now = new Date();
        const periodStart = new Date();

        switch (period) {
          case 'day':
            periodStart.setDate(now.getDate() - 1);
            break;
          case 'week':
            periodStart.setDate(now.getDate() - 7);
            break;
          case 'month':
            periodStart.setMonth(now.getMonth() - 1);
            break;
        }

        const usage = await provider.analytics.getUsage({
          from: periodStart,
          to: now
        });

        return {
          period,
          totalSent: usage.sentMessages,
          totalDelivered: usage.deliveredMessages,
          totalFailed: usage.failedMessages,
          deliveryRate: usage.deliveryRate,
          periodStart: periodStart.toISOString(),
          periodEnd: now.toISOString(),
          breakdown: usage.breakdown
        };
      } catch (error) {
        console.warn('Failed to get message stats:', error);
        return {
          period,
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          deliveryRate: 0,
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },

    /**
     * Get template usage analytics
     */
    async getTemplateUsage(templateCode?: string) {
      try {
        const now = new Date();
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);

        if (templateCode) {
          const stats = await provider.analytics.getTemplateStats(templateCode, {
            from: monthAgo,
            to: now
          });

          return {
            templateCode,
            totalUsage: stats.totalSent,
            successCount: stats.delivered,
            failureCount: stats.failed,
            successRate: stats.deliveryRate,
            lastUsed: new Date().toISOString(),
            averageDeliveryTime: stats.averageDeliveryTime
          };
        }

        // Get usage for all templates by getting overall stats
        const usage = await provider.analytics.getUsage({
          from: monthAgo,
          to: now
        });

        const templateUsage = Object.entries(usage.breakdown.byTemplate).map(([code, count]) => {
          const successCount = Math.round(count * (usage.deliveryRate / 100));
          const failureCount = count - successCount;

          return {
            templateCode: code,
            totalUsage: count,
            successCount,
            failureCount,
            successRate: usage.deliveryRate
          };
        });

        return templateUsage.sort((a, b) => b.totalUsage - a.totalUsage);
      } catch (error) {
        console.warn('Failed to get template usage:', error);
        return templateCode ? {
          templateCode,
          totalUsage: 0,
          successCount: 0,
          failureCount: 0,
          successRate: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : [];
      }
    },

    /**
     * Generate usage reports
     */
    async generateReport(type: 'daily' | 'weekly' | 'monthly', format: 'json' | 'csv' = 'json') {
      try {
        const now = new Date();
        const periodStart = new Date();

        switch (type) {
          case 'daily':
            periodStart.setDate(now.getDate() - 1);
            break;
          case 'weekly':
            periodStart.setDate(now.getDate() - 7);
            break;
          case 'monthly':
            periodStart.setMonth(now.getMonth() - 1);
            break;
        }

        const usage = await provider.analytics.getUsage({
          from: periodStart,
          to: now
        });

        const templateUsage = await this.getTemplateUsage();
        const topTemplates = Array.isArray(templateUsage) ?
          templateUsage.slice(0, 3).map(t => t.templateCode) : [];

        const data = {
          reportType: type,
          generatedAt: new Date().toISOString(),
          period: {
            from: periodStart.toISOString(),
            to: now.toISOString()
          },
          summary: {
            totalMessages: usage.totalMessages,
            successRate: usage.deliveryRate,
            failureRate: usage.failureRate,
            topTemplates
          },
          breakdown: {
            byTemplate: usage.breakdown.byTemplate,
            byDay: usage.breakdown.byDay,
            byHour: usage.breakdown.byHour
          }
        };

        return format === 'csv' ? this.toCsv(data) : data;
      } catch (error) {
        console.warn('Failed to generate report:', error);
        const fallbackData = {
          reportType: type,
          generatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          summary: {
            totalMessages: 0,
            successRate: 0,
            failureRate: 0,
            topTemplates: []
          }
        };
        return format === 'csv' ? this.toCsv(fallbackData) : fallbackData;
      }
    },

    /**
     * Get delivery status breakdown
     */
    async getDeliveryStats(templateCode?: string) {
      try {
        const now = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);

        const usage = await provider.analytics.getUsage({
          from: weekAgo,
          to: now
        });

        let filtered = usage;
        if (templateCode) {
          const templateCount = usage.breakdown.byTemplate[templateCode] || 0;
          const templateDelivered = Math.round(templateCount * (usage.deliveryRate / 100));
          const templateFailed = Math.round(templateCount * (usage.failureRate / 100));
          const templatePending = templateCount - templateDelivered - templateFailed;

          return {
            templateCode,
            delivered: templateDelivered,
            pending: templatePending,
            failed: templateFailed,
            total: templateCount,
            breakdown: {
              'DELIVERED': templateCount > 0 ? (templateDelivered / templateCount) * 100 : 0,
              'PENDING': templateCount > 0 ? (templatePending / templateCount) * 100 : 0,
              'FAILED': templateCount > 0 ? (templateFailed / templateCount) * 100 : 0
            }
          };
        }

        const pending = Math.max(0, usage.totalMessages - usage.deliveredMessages - usage.failedMessages);

        return {
          templateCode: undefined,
          delivered: usage.deliveredMessages,
          pending,
          failed: usage.failedMessages,
          total: usage.totalMessages,
          breakdown: {
            'DELIVERED': usage.deliveryRate,
            'PENDING': usage.totalMessages > 0 ? (pending / usage.totalMessages) * 100 : 0,
            'FAILED': usage.failureRate
          }
        };
      } catch (error) {
        console.warn('Failed to get delivery stats:', error);
        return {
          templateCode,
          delivered: 0,
          pending: 0,
          failed: 0,
          total: 0,
          breakdown: {
            'DELIVERED': 0,
            'PENDING': 0,
            'FAILED': 0
          },
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },

    /**
     * Convert data to CSV format
     */
    toCsv(data: any): string {
      // Simple CSV conversion
      return JSON.stringify(data, null, 2)
        .replace(/[\{\}]/g, '')
        .replace(/"/g, '')
        .replace(/:/g, ',');
    }
  };
}