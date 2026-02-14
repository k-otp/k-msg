import type { Button, MessageType } from "./message";
import type { BalanceQuery, BalanceResult } from "./balance";
import type { HistoryQuery, HistoryResult } from "./history";
import type { ProviderHealthStatus } from "./provider";

export interface PlatformHealthStatus {
  healthy: boolean;
  providers: Record<string, boolean>;
  issues: string[];
}

export interface PlatformInfo {
  version: string;
  providers: string[];
  features: string[];
}

export interface LegacyMessageSendOptions {
  templateId: string;
  recipients: {
    phoneNumber: string;
    variables?: Record<string, any>;
  }[];
  variables: Record<string, any>;
}

export interface UnifiedMessageRecipient {
  phoneNumber: string;
  variables?: Record<string, any>;
}

export interface UnifiedMessageSendOptions {
  channel: MessageType;
  recipients: Array<string | UnifiedMessageRecipient>;
  providerId?: string;
  templateCode?: string;
  variables?: Record<string, any>;
  text?: string;
  subject?: string;
  imageUrl?: string;
  buttons?: Button[];
  options?: {
    scheduledAt?: Date;
    senderNumber?: string;
    subject?: string;
    [key: string]: any;
  };
}

export type MessageSendOptions =
  | LegacyMessageSendOptions
  | UnifiedMessageSendOptions;

export interface MessageSendResult {
  results: Array<{
    messageId?: string;
    status: string;
    phoneNumber: string;
    error?: {
      message: string;
    };
  }>;
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface KMsg {
  getInfo(): PlatformInfo;
  registerProvider(provider: any): void;
  getProvider(providerId: string): any | null;
  listProviders(): string[];
  healthCheck(): Promise<PlatformHealthStatus>;
  balance(providerId?: string): Promise<{
    get(query?: BalanceQuery): Promise<BalanceResult>;
  }>;
  history(providerId?: string): Promise<{
    list(query: HistoryQuery): Promise<HistoryResult>;
    list(
      page?: number,
      pageSize?: number,
      filters?: Partial<Omit<HistoryQuery, "page" | "pageSize">> & {
        channel?: HistoryQuery["channel"];
      },
    ): Promise<HistoryResult>;
  }>;
  messages: {
    send(options: MessageSendOptions): Promise<MessageSendResult>;
    getStatus(messageId: string): Promise<string>;
  };
}

export interface Config {
  defaultProvider?: string;
  providers: string[];
  features: {
    enableBulkSending?: boolean;
    enableScheduling?: boolean;
    enableAnalytics?: boolean;
  };
  messageDefaults?: {
    providerId?: string;
    senderNumber?: string;
    subject?: string;
    templateCodes?: Partial<Record<MessageType, string>>;
    channels?: Partial<
      Record<
        MessageType,
        {
          providerId?: string;
          senderNumber?: string;
          subject?: string;
          templateCode?: string;
        }
      >
    >;
  };
}
