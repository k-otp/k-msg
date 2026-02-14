import type { Button, MessageType } from "./message";

export interface DeliveryStatus {
  status: "pending" | "sent" | "delivered" | "failed" | "cancelled";
  timestamp: Date;
  details?: Record<string, unknown>;
}

export enum StandardStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum StandardErrorCode {
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  INVALID_REQUEST = "INVALID_REQUEST",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}

export interface StandardError {
  code: StandardErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface StandardRequest {
  channel?: MessageType;
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, unknown>;
  text?: string;
  imageUrl?: string;
  buttons?: Button[];
  options?: {
    scheduledAt?: Date;
    senderNumber?: string;
    subject?: string;
    /**
     * Optional international country code for providers that support it (e.g. SOLAPI).
     */
    country?: string;
    /**
     * Provider-supported custom fields (string values only).
     */
    customFields?: Record<string, string>;
    /**
     * Provider-specific KakaoTalk options (e.g. SOLAPI kakaoOptions).
     */
    kakaoOptions?: {
      pfId?: string;
      templateId?: string;
      variables?: Record<string, string>;
      disableSms?: boolean;
      adFlag?: boolean;
      buttons?: unknown[];
      imageId?: string;
      [key: string]: unknown;
    };
    /**
     * Provider-specific Naver SmartAlert options (e.g. SOLAPI naverOptions).
     */
    naverOptions?: {
      talkId?: string;
      templateId?: string;
      disableSms?: boolean;
      variables?: Record<string, string>;
      buttons?: unknown[];
      [key: string]: unknown;
    };
    /**
     * Provider-specific voice(TTS) options (e.g. SOLAPI voiceOptions).
     */
    voiceOptions?: {
      voiceType: "FEMALE" | "MALE";
      headerMessage?: string;
      tailMessage?: string;
      replyRange?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      counselorNumber?: string;
      [key: string]: unknown;
    };
    /**
     * Provider-specific fax options (e.g. SOLAPI faxOptions).
     */
    faxOptions?: {
      fileIds?: string[];
      fileUrls?: string[];
      [key: string]: unknown;
    };
    /**
     * Provider-specific RCS options (e.g. SOLAPI rcsOptions).
     */
    rcsOptions?: {
      brandId?: string;
      templateId?: string;
      copyAllowed?: boolean;
      variables?: Record<string, string>;
      mmsType?: "M3" | "S3" | "M4" | "S4" | "M5" | "S5" | "M6" | "S6";
      commercialType?: boolean;
      disableSms?: boolean;
      buttons?: unknown[];
      additionalBody?: {
        title?: string;
        description?: string;
        imageId?: string;
        buttons?: unknown[];
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    // biome-ignore lint/suspicious/noExplicitAny: provider-specific options are intentionally untyped
    [key: string]: any;
  };
}

export interface StandardResult {
  messageId: string;
  status: StandardStatus;
  provider: string;
  timestamp: Date;
  phoneNumber: string;
  error?: StandardError;
  metadata?: Record<string, unknown>;
}

export enum TemplateCategory {
  AUTHENTICATION = "AUTHENTICATION",
  NOTIFICATION = "NOTIFICATION",
  PROMOTION = "PROMOTION",
  INFORMATION = "INFORMATION",
  RESERVATION = "RESERVATION",
  SHIPPING = "SHIPPING",
  PAYMENT = "PAYMENT",
}
