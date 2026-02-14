/**
 * IWINV Provider Adapter
 * IWINV API를 표준 인터페이스로 변환하는 어댑터
 */

import {
  type AdapterFactory,
  BaseProviderAdapter,
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type ProviderConfig,
  type ProviderMetadata,
  type Result,
  type StandardError,
  StandardErrorCode,
  type StandardRequest,
  type StandardResult,
  StandardStatus,
  type Template,
  type TemplateProvider,
} from "@k-msg/core";

// IWINV 특화 타입들
export interface IWINVError {
  code: number;
  message: string;
  status?: number;
  data?: unknown;
}

export interface IWINVRequest {
  templateCode: string;
  reserve?: "Y" | "N";
  sendDate?: string;
  reSend?: "Y" | "N";
  resendCallback?: string;
  resendType?: "Y" | "N";
  resendTitle?: string;
  resendContent?: string;
  list: IWINVRecipient[];
}

export interface IWINVRecipient {
  phone: string;
  templateParam?: string[];
}

export interface IWINVResponse {
  code: number;
  message: string;
  success?: number;
  fail?: number;
  seqNo?: number;
}

export interface IWINVBalanceResponse {
  code: number;
  charge: number;
}

export interface IWINVTemplate {
  templateCode: string;
  templateName: string;
  templateContent: string;
  status: "Y" | "I" | "R";
  templateStatusMsg?: string;
  templateStatusComments?: string;
  createDate: string;
  buttons: any[];
}

export interface IWINVTemplateListResponse extends IWINVResponse {
  totalCount: number;
  list: IWINVTemplate[];
}

// 타입 가드 함수들
export function isIWINVError(error: unknown): error is IWINVError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as IWINVError).code === "number"
  );
}

export function isIWINVResponse(response: unknown): response is IWINVResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "code" in response &&
    "message" in response
  );
}

export function isIWINVBalanceResponse(
  response: unknown,
): response is IWINVBalanceResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "code" in response &&
    "charge" in response
  );
}

export interface IWINVConfig extends ProviderConfig {
  userId?: string;
  senderNumber?: string;
  sendEndpoint?: string;
}

/**
 * IWINV API 어댑터 구현
 */
export class IWINVAdapter
  extends BaseProviderAdapter
  implements TemplateProvider
{
  private static readonly directTemplates = new Set([
    "SMS_DIRECT",
    "LMS_DIRECT",
    "MMS_DIRECT",
  ]);

  private readonly endpoints = {
    send: "/api/v2/send/",
    template: "/template/",
    history: "/history/",
    balance: "/balance/",
    cancel: "/cancel/",
  };

  constructor(config: IWINVConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
    if (!config.baseUrl) {
      throw new Error("Base URL is required");
    }
    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error("Base URL must be a valid URL");
    }
    super(config);
  }

  adaptRequest(request: StandardRequest): IWINVRequest {
    this.log("Adapting standard request to IWINV format", request);

    // 예약 발송 처리
    const isScheduled = !!request.options?.scheduledAt;
    const sendDate = isScheduled
      ? this.formatIWINVDate(request.options!.scheduledAt!)
      : undefined;

    const channel = request.channel || request.options?.channel;
    const isDirectMessageChannel =
      channel === "SMS" ||
      channel === "LMS" ||
      channel === "MMS" ||
      channel === "sms" ||
      channel === "mms" ||
      IWINVAdapter.directTemplates.has(request.templateCode);

    const messageContent =
      request.text ??
      (typeof request.variables?.message === "string"
        ? request.variables.message
        : undefined) ??
      (typeof request.variables?._full_text === "string"
        ? request.variables._full_text
        : undefined);

    // 템플릿 변수를 IWINV 형식으로 변환
    const templateParam = isDirectMessageChannel
      ? undefined
      : Object.values(request.variables).map(String);

    const resendTitle =
      request.options?.subject ??
      (typeof request.variables?.subject === "string"
        ? request.variables.subject
        : undefined);

    const iwinvRequest: IWINVRequest = {
      templateCode: request.templateCode,
      reserve: isScheduled ? "Y" : "N",
      sendDate,
      reSend: "Y", // 기본적으로 대체발송 활성화
      resendCallback:
        request.options?.senderNumber ||
        (this.config as IWINVConfig).senderNumber,
      resendType: messageContent ? "N" : "Y", // N: 직접입력, Y: 알림톡내용
      resendTitle,
      resendContent: messageContent,
      list: [
        {
          phone: request.phoneNumber,
          templateParam:
            templateParam && templateParam.length > 0
              ? templateParam
              : undefined,
        },
      ],
    };

    this.log("Converted to IWINV request", iwinvRequest);
    return iwinvRequest;
  }

  adaptResponse(response: IWINVResponse): StandardResult {
    this.log("Adapting IWINV response to standard format", response);

    const isSuccess = response.code === 200;
    const status = this.mapIWINVStatus(response.code);

    const result: StandardResult = {
      messageId: response.seqNo?.toString() || this.generateMessageId(),
      status,
      provider: "iwinv",
      timestamp: new Date(),
      phoneNumber: "", // IWINV 응답에는 포함되지 않음, 요청 시 별도 저장 필요
      error: !isSuccess ? this.mapError(response) : undefined,
      metadata: {
        success: response.success,
        fail: response.fail,
        originalCode: response.code,
      },
    };

    this.log("Converted to standard result", result);
    return result;
  }

  mapError(error: IWINVError | Error | unknown): StandardError {
    this.log("Mapping IWINV error", error);

    let standardCode = StandardErrorCode.UNKNOWN_ERROR;
    let retryable = false;
    let message = "Unknown error";

    // IWINV 에러 처리
    if (isIWINVError(error)) {
      message = error.message;
      switch (error.code) {
        case 200:
          // 성공이므로 에러가 아님
          break;
        case 201:
          standardCode = StandardErrorCode.AUTHENTICATION_FAILED;
          retryable = false;
          break;
        case 206:
          standardCode = StandardErrorCode.AUTHENTICATION_FAILED;
          retryable = false;
          break;
        case 400:
          standardCode = StandardErrorCode.INVALID_REQUEST;
          retryable = false;
          break;
        case 401:
          standardCode = StandardErrorCode.AUTHENTICATION_FAILED;
          retryable = false;
          break;
        case 403:
          standardCode = StandardErrorCode.INSUFFICIENT_BALANCE;
          retryable = false;
          break;
        case 404:
          standardCode = StandardErrorCode.TEMPLATE_NOT_FOUND;
          retryable = false;
          break;
        case 501:
        case 502:
        case 503:
        case 504:
        case 505:
        case 506:
        case 507:
        case 508:
        case 509:
        case 510:
        case 511:
        case 512:
        case 513:
        case 514:
        case 515:
        case 516:
        case 517:
        case 540:
          standardCode = StandardErrorCode.INVALID_REQUEST;
          retryable = false;
          break;
        case 518:
          standardCode = StandardErrorCode.PROVIDER_ERROR;
          retryable = true;
          break;
        case 519:
          standardCode = StandardErrorCode.INSUFFICIENT_BALANCE;
          retryable = false;
          break;
        case 429:
          standardCode = StandardErrorCode.RATE_LIMIT_EXCEEDED;
          retryable = true;
          break;
        case 500:
          standardCode = StandardErrorCode.PROVIDER_ERROR;
          retryable = true;
          break;
        default:
          if (error.code >= 500) {
            standardCode = StandardErrorCode.PROVIDER_ERROR;
            retryable = true;
          } else {
            standardCode = StandardErrorCode.INVALID_REQUEST;
            retryable = false;
          }
      }
    } else if (error instanceof Error) {
      message = error.message;
      standardCode = StandardErrorCode.NETWORK_ERROR;
      retryable = true;
    } else if (typeof error === "string") {
      message = error;
    } else {
      message = String(error);
    }

    return {
      code: standardCode,
      message,
      retryable,
      details: {
        originalError: error,
        provider: "iwinv",
      },
    };
  }

  getAuthHeaders(): Record<string, string> {
    return {
      AUTH: btoa(this.config.apiKey),
      "Content-Type": "application/json",
    };
  }

  getBaseUrl(): string {
    return this.config.baseUrl || "https://alimtalk.bizservice.iwinv.kr";
  }

  getEndpoint(operation: string): string {
    if (operation === "send") {
      const configuredSendEndpoint = (this.config as IWINVConfig).sendEndpoint;
      if (configuredSendEndpoint && configuredSendEndpoint.length > 0) {
        return configuredSendEndpoint.startsWith("/")
          ? configuredSendEndpoint
          : `/${configuredSendEndpoint}`;
      }
    }

    const endpoint = this.endpoints[operation as keyof typeof this.endpoints];
    if (!endpoint) {
      throw new Error(`Unsupported operation: ${operation}`);
    }
    return endpoint;
  }

  getRequestConfig(): RequestInit {
    return {
      method: "POST",
      headers: this.getAuthHeaders(),
    };
  }

  async createTemplate(
    template: Omit<Template, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<Result<Template, KMsgError>> {
    try {
      this.log("Creating template", template);
      const url = `${this.getBaseUrl()}${this.getEndpoint("template")}create`;
      const response = await fetch(url, {
        ...this.getRequestConfig(),
        body: JSON.stringify({
          templateName: template.name,
          templateContent: template.content,
          buttons: template.buttons,
        }),
      });

      const responseData = await response.json();
      if (responseData.code !== 200) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            responseData.message || "Failed to create template",
          ),
        );
      }

      return ok({
        ...template,
        id: template.code,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      this.log("Failed to create template", error);
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  async updateTemplate(
    code: string,
    template: Partial<
      Omit<Template, "id" | "code" | "status" | "createdAt" | "updatedAt">
    >,
  ): Promise<Result<Template, KMsgError>> {
    try {
      this.log(`Updating template ${code}`, template);
      const url = `${this.getBaseUrl()}${this.getEndpoint("template")}modify`;

      const existingResult = await this.getTemplate(code);
      if (existingResult.isFailure) {
        return existingResult;
      }
      const existing = existingResult.value;

      const response = await fetch(url, {
        ...this.getRequestConfig(),
        body: JSON.stringify({
          templateCode: code,
          templateName: template.name || existing.name,
          templateContent: template.content || existing.content,
          buttons: template.buttons || existing.buttons,
        }),
      });

      const responseData = await response.json();
      if (responseData.code !== 200) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            responseData.message || "Failed to update template",
          ),
        );
      }

      return ok({
        ...existing,
        ...template,
        updatedAt: new Date(),
      });
    } catch (error) {
      this.log(`Failed to update template ${code}`, error);
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  async deleteTemplate(code: string): Promise<Result<void, KMsgError>> {
    try {
      this.log(`Deleting template ${code}`);
      const url = `${this.getBaseUrl()}${this.getEndpoint("template")}delete`;
      const response = await fetch(url, {
        ...this.getRequestConfig(),
        body: JSON.stringify({
          templateCode: code,
        }),
      });

      const responseData = await response.json();
      if (responseData.code !== 200) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            responseData.message || "Failed to delete template",
          ),
        );
      }

      return ok(undefined);
    } catch (error) {
      this.log(`Failed to delete template ${code}`, error);
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  async getTemplate(code: string): Promise<Result<Template, KMsgError>> {
    try {
      this.log(`Getting template ${code}`);
      const url = `${this.getBaseUrl()}${this.getEndpoint("template")}list`;
      const queryParams = new URLSearchParams();
      queryParams.append("templateCode", code);

      const response = await fetch(
        `${url}?${queryParams.toString()}`,
        this.getRequestConfig(),
      );
      if (!response.ok) {
        return fail(
          new KMsgError(
            KMsgErrorCode.NETWORK_ERROR,
            `HTTP error! status: ${response.status}`,
          ),
        );
      }

      const responseData = (await response.json()) as IWINVTemplateListResponse;
      if (responseData.code !== 200) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            responseData.message || "Failed to get template",
          ),
        );
      }

      const iwinvTemplate = responseData.list.find(
        (t) => t.templateCode === code,
      );
      if (!iwinvTemplate) {
        return fail(
          new KMsgError(
            KMsgErrorCode.TEMPLATE_NOT_FOUND,
            `Template with code ${code} not found`,
          ),
        );
      }

      return ok(this.mapIWINVTemplate(iwinvTemplate));
    } catch (error) {
      this.log(`Failed to get template ${code}`, error);
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  async listTemplates(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<Template[], KMsgError>> {
    try {
      this.log("Listing templates", params);
      const url = `${this.getBaseUrl()}${this.getEndpoint("template")}list`;
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append("pageNum", params.page.toString());
      if (params?.limit)
        queryParams.append("pageSize", params.limit.toString());
      if (params?.status) {
        const iwinvStatus =
          params.status === "APPROVED"
            ? "Y"
            : params.status === "REJECTED"
              ? "R"
              : params.status === "PENDING"
                ? "I"
                : undefined;
        if (iwinvStatus) queryParams.append("templateStatus", iwinvStatus);
      }

      const response = await fetch(
        `${url}?${queryParams.toString()}`,
        this.getRequestConfig(),
      );
      if (!response.ok) {
        return fail(
          new KMsgError(
            KMsgErrorCode.NETWORK_ERROR,
            `HTTP error! status: ${response.status}`,
          ),
        );
      }

      const responseData = (await response.json()) as IWINVTemplateListResponse;
      if (responseData.code !== 200) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            responseData.message || "Failed to list templates",
          ),
        );
      }

      const templates = responseData.list.map((t) => this.mapIWINVTemplate(t));
      return ok(templates);
    } catch (error) {
      this.log("Failed to list templates", error);
      return fail(
        new KMsgError(
          KMsgErrorCode.NETWORK_ERROR,
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  private mapIWINVTemplate(iwinvTemplate: IWINVTemplate): Template {
    return {
      id: iwinvTemplate.templateCode,
      code: iwinvTemplate.templateCode,
      name: iwinvTemplate.templateName,
      content: iwinvTemplate.templateContent,
      status: this.mapIWINVTemplateStatus(iwinvTemplate.status),
      buttons: iwinvTemplate.buttons,
      createdAt: new Date(iwinvTemplate.createDate),
      updatedAt: new Date(iwinvTemplate.createDate),
    };
  }

  private mapIWINVTemplateStatus(
    status: "Y" | "I" | "R",
  ): "APPROVED" | "PENDING" | "REJECTED" {
    switch (status) {
      case "Y":
        return "APPROVED";
      case "I":
        return "PENDING";
      case "R":
        return "REJECTED";
      default:
        return "PENDING";
    }
  }

  isRetryableError(error: IWINVError | Error | unknown): boolean {
    if (isIWINVError(error)) {
      // 5xx 에러나 429 (Rate Limit)는 재시도 가능
      return error.code >= 500 || error.code === 429;
    }
    return super.isRetryableError(error);
  }

  /**
   * IWINV 날짜 형식으로 변환 (yyyy-MM-dd HH:mm:ss)
   */
  private formatIWINVDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * IWINV 상태 코드를 표준 상태로 매핑
   */
  private mapIWINVStatus(code: number): StandardStatus {
    switch (code) {
      case 200:
        return StandardStatus.SENT;
      case 201:
      case 206:
      case 400:
      case 401:
      case 403:
      case 404:
      case 501:
      case 502:
      case 503:
      case 504:
      case 505:
      case 506:
      case 507:
      case 508:
      case 509:
      case 510:
      case 511:
      case 512:
      case 513:
      case 514:
      case 515:
      case 516:
      case 517:
      case 519:
      case 540:
        return StandardStatus.FAILED;
      case 518:
      case 429:
      case 500:
        return StandardStatus.PENDING; // 재시도 가능한 상태
      default:
        return StandardStatus.FAILED;
    }
  }

  /**
   * IWINV 특화 기능: 예약 발송 취소
   */
  async cancelScheduledMessage(messageId: string): Promise<boolean> {
    try {
      const url = `${this.getBaseUrl()}${this.getEndpoint("cancel")}`;
      const response = await fetch(url, {
        ...this.getRequestConfig(),
        body: JSON.stringify({ seqNo: parseInt(messageId) }),
      });

      if (!response.ok) {
        return false;
      }

      const responseData = await response.json();
      if (!isIWINVResponse(responseData)) {
        throw new Error("Invalid IWINV response format");
      }
      const result = responseData;
      return result.code === 200;
    } catch (error) {
      this.log("Failed to cancel scheduled message", error);
      return false;
    }
  }

  /**
   * IWINV 특화 기능: 잔액 조회
   */
  async getBalance(): Promise<number> {
    try {
      const url = `${this.getBaseUrl()}${this.getEndpoint("balance")}`;
      const response = await fetch(url, this.getRequestConfig());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const responseData = await response.json();
      if (!isIWINVBalanceResponse(responseData)) {
        throw new Error("Invalid balance response format");
      }
      const result = responseData;
      return result.charge || 0;
    } catch (error) {
      this.log("Failed to get balance", error);
      return 0;
    }
  }
}

/**
 * IWINV 어댑터 팩토리
 */
export class IWINVAdapterFactory implements AdapterFactory {
  create(config: ProviderConfig): BaseProviderAdapter {
    if (!this.isValidIWINVConfig(config)) {
      throw new Error("Invalid IWINV configuration");
    }
    return new IWINVAdapter(config);
  }

  private isValidIWINVConfig(config: ProviderConfig): config is IWINVConfig {
    return (
      config.apiKey !== undefined &&
      config.baseUrl !== undefined &&
      typeof config.apiKey === "string" &&
      typeof config.baseUrl === "string"
    );
  }

  supports(providerId: string): boolean {
    return providerId.toLowerCase() === "iwinv";
  }

  getMetadata(): ProviderMetadata {
    return {
      id: "iwinv",
      name: "IWINV AlimTalk Provider",
      version: "1.0.0",
      description: "IWINV AlimTalk messaging service adapter",
      supportedFeatures: [
        "alimtalk",
        "template_messaging",
        "scheduled_messaging",
        "bulk_messaging",
        "status_tracking",
        "balance_checking",
      ],
      capabilities: {
        maxRecipientsPerRequest: 10000,
        maxRequestsPerSecond: 100,
        supportsBulk: true,
        supportsScheduling: true,
        supportsTemplating: true,
        supportsWebhooks: false,
      },
      endpoints: {
        send: "/api/v2/send/",
        template: "/template/",
        history: "/history/",
        balance: "/balance/",
        cancel: "/cancel/",
      },
      authType: "header",
      responseFormat: "json",
    };
  }
}
