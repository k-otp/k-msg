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
  details?: Record<string, any>;
}

export interface StandardRequest {
  channel?: MessageType;
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, any>;
  text?: string;
  imageUrl?: string;
  buttons?: Button[];
  options?: {
    scheduledAt?: Date;
    senderNumber?: string;
    subject?: string;
    /**
     * Provider-specific KakaoTalk options (e.g. SOLAPI kakaoOptions).
     */
    kakaoOptions?: {
      pfId?: string;
      templateId?: string;
      variables?: Record<string, string>;
      disableSms?: boolean;
      adFlag?: boolean;
      buttons?: any[];
      imageId?: string;
      [key: string]: any;
    };
    /**
     * Provider-specific RCS options (e.g. SOLAPI rcsOptions).
     */
    rcsOptions?: {
      brandId?: string;
      templateId?: string;
      variables?: Record<string, string>;
      disableSms?: boolean;
      buttons?: any[];
      additionalBody?: any;
      [key: string]: any;
    };
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
  metadata?: Record<string, any>;
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
