import type {
  BaseProvider,
  BalanceQuery,
  BalanceResult,
  Config,
  HistoryQuery,
  HistoryResult,
  KMsg,
  LegacyMessageSendOptions,
  MessageSendOptions,
  MessageSendResult,
  MessageType,
  PlatformHealthStatus,
  PlatformInfo,
  StandardRequest,
  UnifiedMessageRecipient,
  UnifiedMessageSendOptions,
} from "./types/index";

/**
 * Core AlimTalk Platform implementation
 */
export class AlimTalkPlatform implements KMsg {
  private static readonly channelTemplateFallbacks: Partial<
    Record<MessageType, string>
  > = {
    SMS: "SMS_DIRECT",
    LMS: "LMS_DIRECT",
    MMS: "MMS_DIRECT",
    FRIENDTALK: "FRIENDTALK_DIRECT",
  };

  private static readonly directTemplateCodes = new Set([
    "SMS_DIRECT",
    "LMS_DIRECT",
    "MMS_DIRECT",
    "FRIENDTALK_DIRECT",
  ]);

  private providers = new Map<string, BaseProvider>();
  private config: Config;
  private defaultProvider?: string;

  constructor(config: Config) {
    this.config = config;
    this.defaultProvider = config.defaultProvider;
  }

  // Basic information
  getInfo(): PlatformInfo {
    return {
      version: "0.1.0",
      providers: Array.from(this.providers.keys()),
      features: this.config.features
        ? Object.keys(this.config.features).filter(
            (k) => this.config.features[k as keyof typeof this.config.features],
          )
        : [],
    };
  }

  // Provider management with clean API
  registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): BaseProvider | null {
    return this.providers.get(providerId) || null;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDefaultProvider(): BaseProvider | null {
    if (!this.defaultProvider) return null;
    return this.getProvider(this.defaultProvider);
  }

  private isLegacySendOptions(
    options: MessageSendOptions,
  ): options is LegacyMessageSendOptions {
    return "templateId" in options;
  }

  private getProviderOrThrow(providerId?: string): BaseProvider {
    const provider = providerId
      ? this.getProvider(providerId)
      : this.getDefaultProvider();
    if (!provider) {
      if (providerId) {
        throw new Error(`Provider ${providerId} not found`);
      }
      throw new Error("No provider available for messaging");
    }
    return provider;
  }

  private resolveProviderForSend(options: MessageSendOptions): BaseProvider {
    if (this.isLegacySendOptions(options)) {
      return this.getProviderOrThrow(this.config.messageDefaults?.providerId);
    }

    const channelDefaults =
      this.config.messageDefaults?.channels?.[options.channel];
    const providerId =
      options.providerId ??
      channelDefaults?.providerId ??
      this.config.messageDefaults?.providerId;
    return this.getProviderOrThrow(providerId);
  }

  private normalizeUnifiedRecipients(
    recipients: Array<string | UnifiedMessageRecipient>,
  ): UnifiedMessageRecipient[] {
    return recipients.map((recipient) => {
      if (typeof recipient === "string") {
        return { phoneNumber: recipient };
      }
      return recipient;
    });
  }

  private resolveTemplateCode(options: UnifiedMessageSendOptions): string {
    const channelDefaults =
      this.config.messageDefaults?.channels?.[options.channel];
    const configuredTemplateCode =
      this.config.messageDefaults?.templateCodes?.[options.channel];
    const fallbackTemplateCode =
      AlimTalkPlatform.channelTemplateFallbacks[options.channel];

    const templateCode =
      options.templateCode ||
      channelDefaults?.templateCode ||
      configuredTemplateCode ||
      fallbackTemplateCode;

    if (!templateCode) {
      throw new Error(
        `templateCode is required for ${options.channel}. ` +
          "Provide it in send options or configure config.messageDefaults.",
      );
    }

    return templateCode;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "message" in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
    return this.toErrorMessage(error);
  }

  private hasResultFailureShape(
    value: unknown,
  ): value is { isFailure: true; isSuccess: false; error: unknown } {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const record = value as Record<string, unknown>;
    return (
      record.isFailure === true &&
      record.isSuccess === false &&
      "error" in record
    );
  }

  private hasResultSuccessShape(
    value: unknown,
  ): value is { isFailure: false; isSuccess: true; value: unknown } {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const record = value as Record<string, unknown>;
    return (
      record.isFailure === false &&
      record.isSuccess === true &&
      "value" in record
    );
  }

  private isFailedDeliveryStatus(status: string): boolean {
    const normalized = status.trim().toUpperCase();
    return normalized === "FAILED" || normalized === "CANCELLED";
  }

  private normalizeSendResult(result: unknown): {
    messageId?: string;
    status: string;
    failed: boolean;
    errorMessage?: string;
  } {
    if (this.hasResultFailureShape(result)) {
      return {
        status: "FAILED",
        failed: true,
        errorMessage: this.extractErrorMessage(result.error),
      };
    }

    const payload = this.hasResultSuccessShape(result) ? result.value : result;
    if (typeof payload !== "object" || payload === null) {
      return {
        status: "FAILED",
        failed: true,
        errorMessage: "Provider returned an invalid send response",
      };
    }

    const record = payload as Record<string, unknown>;
    const status = typeof record.status === "string" ? record.status : "SENT";
    const failedByStatus = this.isFailedDeliveryStatus(status);
    const errorMessage =
      record.error !== undefined
        ? this.extractErrorMessage(record.error)
        : undefined;

    return {
      messageId:
        typeof record.messageId === "string" ? record.messageId : undefined,
      status,
      failed: failedByStatus || errorMessage !== undefined,
      errorMessage,
    };
  }

  private hasTextContent(options: UnifiedMessageSendOptions): boolean {
    if (typeof options.text === "string" && options.text.trim().length > 0) {
      return true;
    }

    if (
      typeof options.variables?.message === "string" &&
      options.variables.message.trim().length > 0
    ) {
      return true;
    }

    return options.recipients.some((recipient) => {
      if (typeof recipient === "string") {
        return false;
      }
      return (
        typeof recipient.variables?.message === "string" &&
        recipient.variables.message.trim().length > 0
      );
    });
  }

  private validateUnifiedSendOptions(
    options: UnifiedMessageSendOptions,
    recipients: UnifiedMessageRecipient[],
    templateCode: string,
  ): void {
    if (recipients.length === 0) {
      throw new Error("recipients must not be empty");
    }

    for (const recipient of recipients) {
      if (!recipient.phoneNumber || recipient.phoneNumber.trim().length === 0) {
        throw new Error("recipient.phoneNumber is required");
      }
    }

    const requiresText =
      options.channel === "SMS" ||
      options.channel === "LMS" ||
      options.channel === "MMS" ||
      options.channel === "FRIENDTALK" ||
      AlimTalkPlatform.directTemplateCodes.has(templateCode);

    if (requiresText && !this.hasTextContent(options)) {
      throw new Error(
        `text or variables.message is required for ${options.channel}`,
      );
    }
  }

  private toProviderChannel(
    channel: MessageType,
  ): "alimtalk" | "friendtalk" | "sms" | "mms" {
    switch (channel) {
      case "ALIMTALK":
        return "alimtalk";
      case "FRIENDTALK":
        return "friendtalk";
      case "MMS":
        return "mms";
      case "SMS":
      case "LMS":
      default:
        return "sms";
    }
  }

  private async sendLegacyMessages(
    provider: BaseProvider,
    options: LegacyMessageSendOptions,
  ): Promise<MessageSendResult> {
    const results = [];
    const summary = { total: options.recipients.length, sent: 0, failed: 0 };

    for (const recipient of options.recipients) {
      try {
        const mergedVariables = {
          ...options.variables,
          ...recipient.variables,
        };
        const result = await provider.send({
          templateCode: options.templateId,
          phoneNumber: recipient.phoneNumber,
          variables: mergedVariables,
        } as StandardRequest);

        const normalizedResult = this.normalizeSendResult(result);
        if (normalizedResult.failed) {
          summary.failed++;
        } else {
          summary.sent++;
        }

        results.push({
          messageId: normalizedResult.messageId,
          status: normalizedResult.status,
          phoneNumber: recipient.phoneNumber,
          error: normalizedResult.errorMessage
            ? { message: normalizedResult.errorMessage }
            : undefined,
        });
      } catch (error) {
        summary.failed++;
        results.push({
          phoneNumber: recipient.phoneNumber,
          status: "failed",
          error: { message: this.toErrorMessage(error) },
        });
      }
    }

    return { results, summary };
  }

  private async sendUnifiedMessages(
    provider: BaseProvider,
    options: UnifiedMessageSendOptions,
  ): Promise<MessageSendResult> {
    const channelDefaults =
      this.config.messageDefaults?.channels?.[options.channel];
    const recipients = this.normalizeUnifiedRecipients(options.recipients);
    const templateCode = this.resolveTemplateCode(options);
    this.validateUnifiedSendOptions(options, recipients, templateCode);
    const results = [];
    const summary = { total: recipients.length, sent: 0, failed: 0 };

    const senderNumber =
      options.options?.senderNumber ??
      channelDefaults?.senderNumber ??
      this.config.messageDefaults?.senderNumber;

    const subject =
      options.options?.subject ??
      options.subject ??
      channelDefaults?.subject ??
      this.config.messageDefaults?.subject;

    const requestOptions: Record<string, any> = {
      ...options.options,
      channel: this.toProviderChannel(options.channel),
    };

    if (senderNumber) {
      requestOptions.senderNumber = senderNumber;
    }
    if (subject) {
      requestOptions.subject = subject;
    }
    if (options.imageUrl !== undefined) {
      requestOptions.imageUrl = options.imageUrl;
    }
    if (options.buttons !== undefined) {
      requestOptions.buttons = options.buttons;
    }

    const baseVariables = { ...(options.variables || {}) };
    if (options.text !== undefined && baseVariables.message === undefined) {
      baseVariables.message = options.text;
    }
    if (subject !== undefined && baseVariables.subject === undefined) {
      baseVariables.subject = subject;
    }

    for (const recipient of recipients) {
      try {
        const mergedVariables = { ...baseVariables, ...recipient.variables };
        const result = await provider.send({
          channel: options.channel,
          templateCode,
          phoneNumber: recipient.phoneNumber,
          variables: mergedVariables,
          text: options.text,
          imageUrl: options.imageUrl,
          buttons: options.buttons,
          options: requestOptions,
        } as StandardRequest);

        const normalizedResult = this.normalizeSendResult(result);
        if (normalizedResult.failed) {
          summary.failed++;
        } else {
          summary.sent++;
        }

        results.push({
          messageId: normalizedResult.messageId,
          status: normalizedResult.status,
          phoneNumber: recipient.phoneNumber,
          error: normalizedResult.errorMessage
            ? { message: normalizedResult.errorMessage }
            : undefined,
        });
      } catch (error) {
        summary.failed++;
        results.push({
          phoneNumber: recipient.phoneNumber,
          status: "failed",
          error: { message: this.toErrorMessage(error) },
        });
      }
    }

    return { results, summary };
  }

  // Health monitoring
  async healthCheck(): Promise<PlatformHealthStatus> {
    const providers: Record<string, boolean> = {};
    const issues: string[] = [];

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.healthCheck();
        providers[name] = health.healthy;
        if (!health.healthy) {
          issues.push(
            `${name}: ${health.issues?.join(", ") || "Unknown issue"}`,
          );
        }
      } catch (error) {
        providers[name] = false;
        issues.push(`${name}: ${error}`);
      }
    }

    const healthy = Object.values(providers).every((h) => h);

    return {
      healthy,
      providers,
      issues,
    };
  }

  // Clean messages interface
  get messages() {
    return {
      send: async (options: MessageSendOptions): Promise<MessageSendResult> => {
        const provider = this.resolveProviderForSend(options);

        if (this.isLegacySendOptions(options)) {
          return this.sendLegacyMessages(provider, options);
        }

        return this.sendUnifiedMessages(provider, options);
      },

      getStatus: async (messageId: string): Promise<string> => {
        const provider = this.getDefaultProvider();
        if (!provider) {
          throw new Error("No provider available");
        }

        // Most providers don't have direct status check, return placeholder
        return "unknown";
      },
    };
  }

  async balance(providerId?: string) {
    const provider = this.getProviderOrThrow(providerId);
    const providerKey = provider.id;
    const adapter = this.getProviderAdapter(provider);

    return {
      get: async (query: BalanceQuery = {}): Promise<BalanceResult> => {
        const channel = query.channel;

        // Prefer channel-specific balance when applicable.
        if (this.isSmsChannel(channel)) {
          const getSmsCharge =
            adapter && typeof (adapter as any).getSmsCharge === "function"
              ? (adapter as any).getSmsCharge.bind(adapter)
              : typeof (provider as any).getSmsCharge === "function"
                ? (provider as any).getSmsCharge.bind(provider)
                : undefined;

          if (getSmsCharge) {
            const amount = await getSmsCharge();
            return {
              providerId: providerKey,
              channel,
              amount: typeof amount === "number" ? amount : Number(amount) || 0,
              currency: "KRW",
            };
          }
        }

        const getBalance =
          adapter && typeof (adapter as any).getBalance === "function"
            ? (adapter as any).getBalance.bind(adapter)
            : typeof (provider as any).getBalance === "function"
              ? (provider as any).getBalance.bind(provider)
              : undefined;

        if (!getBalance) {
          throw new Error(`Provider ${providerKey} does not support balance()`);
        }

        const amount = await getBalance();
        return {
          providerId: providerKey,
          channel,
          amount: typeof amount === "number" ? amount : Number(amount) || 0,
        };
      },
    };
  }

  /**
   * @deprecated Template operations are not yet migrated to the new provider interface.
   * Use the provider's adapter directly for template management.
   */
  async templates(providerId?: string) {
    const provider = providerId
      ? this.getProvider(providerId)
      : this.getDefaultProvider();
    if (!provider) {
      throw new Error(`Provider ${providerId || "default"} not found`);
    }

    return {
      /** @deprecated Not yet implemented */
      list: async (_page: number = 1, _size: number = 15, _filters?: any) => {
        throw new Error(
          "Template operations not yet migrated to new provider interface",
        );
      },
      /** @deprecated Not yet implemented */
      create: async (
        _name: string,
        _content: string,
        _category?: string,
        _variables?: any[],
        _buttons?: any[],
      ) => {
        throw new Error(
          "Template operations not yet migrated to new provider interface",
        );
      },
      /** @deprecated Not yet implemented */
      modify: async (
        _templateCode: string,
        _name: string,
        _content: string,
        _buttons?: any[],
      ) => {
        throw new Error(
          "Template operations not yet migrated to new provider interface",
        );
      },
      /** @deprecated Not yet implemented */
      delete: async (_templateCode: string) => {
        throw new Error(
          "Template operations not yet migrated to new provider interface",
        );
      },
    };
  }

  /**
   * History operations (common API surface).
   *
   * Notes:
   * - Not all providers implement history. This method will throw when unsupported.
   * - For provider-specific, advanced fields, use provider adapter directly.
   */
  async history(providerId?: string) {
    const provider = this.getProviderOrThrow(providerId);
    const providerKey = provider.id;
    const adapter = this.getProviderAdapter(provider);

    return {
      list: async (
        queryOrPage: HistoryQuery | number = 1,
        pageSize: number = 15,
        filters?: Partial<Omit<HistoryQuery, "page" | "pageSize">> & {
          channel?: HistoryQuery["channel"];
        },
      ): Promise<HistoryResult> => {
        const query = this.normalizeHistoryQuery(
          queryOrPage,
          pageSize,
          filters,
        );

        const channel = query.channel;
        if (this.isSmsChannel(channel)) {
          const getSmsHistory =
            adapter && typeof (adapter as any).getSmsHistory === "function"
              ? (adapter as any).getSmsHistory.bind(adapter)
              : typeof (provider as any).getSmsHistory === "function"
                ? (provider as any).getSmsHistory.bind(provider)
                : undefined;

          if (!getSmsHistory) {
            throw new Error(
              `Provider ${providerKey} does not support SMS history()`,
            );
          }

          const payload = await getSmsHistory({
            companyId: query.companyId,
            startDate: query.startDate,
            endDate: query.endDate,
            requestNo: query.requestNo,
            pageNum: query.page ?? 1,
            pageSize: query.pageSize ?? pageSize,
            phone: query.phone,
          });

          const rawList = Array.isArray((payload as any).list)
            ? ((payload as any).list as unknown[])
            : [];

          const items = rawList.map((raw) => {
            const record =
              raw && typeof raw === "object"
                ? (raw as Record<string, unknown>)
                : {};
            const messageId =
              typeof record.requestNo === "string" ||
              typeof record.requestNo === "number"
                ? String(record.requestNo)
                : typeof record.seqNo === "string" ||
                    typeof record.seqNo === "number"
                  ? String(record.seqNo)
                  : "unknown";

            const sentAt =
              typeof record.sendDate === "string" && record.sendDate.length > 0
                ? new Date(record.sendDate)
                : undefined;

            return {
              providerId: providerKey,
              channel,
              messageId,
              to: typeof record.phone === "string" ? record.phone : undefined,
              from:
                typeof record.callback === "string"
                  ? record.callback
                  : undefined,
              status:
                typeof record.sendStatus === "string"
                  ? record.sendStatus
                  : undefined,
              statusCode:
                typeof record.sendStatusCode === "string"
                  ? record.sendStatusCode
                  : undefined,
              statusMessage:
                typeof record.sendStatusMsg === "string"
                  ? record.sendStatusMsg
                  : undefined,
              sentAt,
              raw,
            };
          });

          return {
            providerId: providerKey,
            channel,
            totalCount:
              typeof (payload as any).totalCount === "number"
                ? (payload as any).totalCount
                : items.length,
            items,
            raw: payload,
          };
        }

        const getHistory =
          adapter && typeof (adapter as any).getHistory === "function"
            ? (adapter as any).getHistory.bind(adapter)
            : typeof (provider as any).getHistory === "function"
              ? (provider as any).getHistory.bind(provider)
              : undefined;

        if (!getHistory) {
          throw new Error(`Provider ${providerKey} does not support history()`);
        }

        const raw = await getHistory(query);
        return {
          providerId: providerKey,
          channel,
          totalCount: Array.isArray(raw) ? raw.length : 0,
          items: [],
          raw,
        };
      },
      cancelReservation: async (_messageId: string) => {
        throw new Error("cancelReservation is not implemented yet");
      },
    };
  }

  // Provider health with cleaner API
  async providerHealth(providerId: string) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return await provider.healthCheck();
  }

  private getProviderAdapter(provider: BaseProvider): unknown | null {
    const anyProvider = provider as any;
    if (anyProvider && typeof anyProvider.getAdapter === "function") {
      return anyProvider.getAdapter();
    }
    return null;
  }

  private isSmsChannel(channel: MessageType | undefined): boolean {
    return channel === "SMS" || channel === "LMS" || channel === "MMS";
  }

  private normalizeHistoryQuery(
    queryOrPage: HistoryQuery | number,
    pageSize: number,
    filters?: Partial<Omit<HistoryQuery, "page" | "pageSize">> & {
      channel?: HistoryQuery["channel"];
    },
  ): HistoryQuery {
    if (typeof queryOrPage === "object" && queryOrPage !== null) {
      return queryOrPage as HistoryQuery;
    }

    const channel = filters?.channel;
    if (!channel) {
      throw new Error("history.list requires filters.channel");
    }

    const startDate = filters.startDate;
    const endDate = filters.endDate;
    if (!startDate || !endDate) {
      throw new Error("history.list requires filters.startDate and filters.endDate");
    }

    return {
      channel,
      startDate,
      endDate,
      page: queryOrPage,
      pageSize,
      phone: filters.phone,
      requestNo: filters.requestNo,
      companyId: filters.companyId,
    };
  }
}
