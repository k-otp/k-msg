import {
  BaseProviderAdapter,
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  ok,
  type Provider,
  type Result,
  type SendOptions,
  type SendResult,
  type StandardError,
  StandardErrorCode,
  type StandardRequest,
  type StandardResult,
  StandardStatus,
  type Template,
  type TemplateProvider,
} from "@k-msg/core";
import type {
  AligoConfig,
  AligoResponse,
  AligoSMSRequest,
} from "../types/aligo";

type AligoStandardChannel = "ALIMTALK" | "FRIENDTALK" | "SMS" | "LMS" | "MMS";

export class AligoAdapter
  extends BaseProviderAdapter
  implements Provider, TemplateProvider
{
  private static readonly directTemplates = new Set([
    "SMS_DIRECT",
    "LMS_DIRECT",
    "MMS_DIRECT",
    "FRIENDTALK_DIRECT",
  ]);

  readonly id = "aligo";
  readonly name = "Aligo Smart SMS";

  private readonly SMS_HOST: string;
  private readonly ALIMTALK_HOST: string;

  constructor(protected readonly aligoConfig: AligoConfig) {
    super({
      baseUrl: aligoConfig.smsBaseUrl || "https://apis.aligo.in",
      ...aligoConfig,
    });
    this.SMS_HOST = aligoConfig.smsBaseUrl || "https://apis.aligo.in";
    this.ALIMTALK_HOST =
      aligoConfig.alimtalkBaseUrl || "https://kakaoapi.aligo.in";
  }

  async send(params: SendOptions): Promise<Result<SendResult, KMsgError>> {
    try {
      if (params.type === "ALIMTALK") {
        return this.sendAlimTalk(params);
      }
      if (params.type === "FRIENDTALK") {
        return this.sendFriendTalk(params);
      }
      return this.sendSMS(params);
    } catch (error) {
      return fail(this.handleError(error));
    }
  }

  async sendStandard(request: StandardRequest): Promise<StandardResult> {
    try {
      const channel = this.resolveStandardChannel(request);

      if (this.isKakaoChannel(channel) && !this.aligoConfig.senderKey) {
        throw new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Sender key required for KakaoTalk messages",
        );
      }

      let response: AligoResponse;
      if (channel === "ALIMTALK") {
        response = (await this.request(
          this.ALIMTALK_HOST,
          this.getEndpoint("sendAlimTalk"),
          this.buildAlimTalkBodyFromStandard(request),
        )) as AligoResponse;
      } else if (channel === "FRIENDTALK") {
        response = (await this.request(
          this.ALIMTALK_HOST,
          this.getEndpoint("sendFriendTalk"),
          this.buildFriendTalkBodyFromStandard(request),
        )) as AligoResponse;
      } else {
        response = (await this.request(
          this.SMS_HOST,
          this.getEndpoint("sendSMS"),
          this.buildSmsBodyFromStandard(request, channel),
        )) as AligoResponse;
      }

      const expectedSuccessCode = this.isKakaoChannel(channel) ? "0" : "1";
      const isSuccess = response.result_code === expectedSuccessCode;

      return {
        messageId: response.msg_id || this.generateMessageId(),
        status: isSuccess ? StandardStatus.SENT : StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: !isSuccess ? this.mapError(response) : undefined,
        metadata: {
          channel: this.toProviderChannel(channel),
          resultCode: response.result_code,
          resultMessage: response.message,
        },
      };
    } catch (error) {
      return {
        messageId: this.generateMessageId(),
        status: StandardStatus.FAILED,
        provider: this.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
        error: this.mapError(error),
      };
    }
  }

  adaptRequest(request: StandardRequest): any {
    const channel = this.resolveStandardChannel(request);
    if (channel === "ALIMTALK") {
      return this.buildAlimTalkBodyFromStandard(request);
    }
    if (channel === "FRIENDTALK") {
      return this.buildFriendTalkBodyFromStandard(request);
    }
    return this.buildSmsBodyFromStandard(request, channel);
  }

  adaptResponse(response: AligoResponse): StandardResult {
    const isSuccess =
      response.result_code === "1" || response.result_code === "0";
    return {
      messageId: response.msg_id || this.generateMessageId(),
      status: isSuccess ? StandardStatus.SENT : StandardStatus.FAILED,
      provider: this.id,
      timestamp: new Date(),
      phoneNumber: "",
      error: !isSuccess ? this.mapError(response) : undefined,
    };
  }

  mapError(error: any): StandardError {
    const kmsgError = this.mapAligoError(error);

    let code: StandardErrorCode = StandardErrorCode.PROVIDER_ERROR;
    switch (kmsgError.code) {
      case KMsgErrorCode.AUTHENTICATION_FAILED:
        code = StandardErrorCode.AUTHENTICATION_FAILED;
        break;
      case KMsgErrorCode.INSUFFICIENT_BALANCE:
        code = StandardErrorCode.INSUFFICIENT_BALANCE;
        break;
      case KMsgErrorCode.TEMPLATE_NOT_FOUND:
        code = StandardErrorCode.TEMPLATE_NOT_FOUND;
        break;
      case KMsgErrorCode.INVALID_REQUEST:
        code = StandardErrorCode.INVALID_REQUEST;
        break;
      case KMsgErrorCode.NETWORK_ERROR:
        code = StandardErrorCode.NETWORK_ERROR;
        break;
      default:
        code = StandardErrorCode.PROVIDER_ERROR;
    }

    return {
      code,
      message: kmsgError.message,
      retryable:
        code === StandardErrorCode.PROVIDER_ERROR ||
        code === StandardErrorCode.NETWORK_ERROR,
    };
  }

  private mapAligoError(error: any): KMsgError {
    if (error instanceof KMsgError) return error;

    const resultCode =
      error && error.result_code ? String(error.result_code) : "UNKNOWN";
    const message =
      error && (error.message || error.msg)
        ? error.message || error.msg
        : "Unknown Aligo error";

    let code: KMsgErrorCode = KMsgErrorCode.PROVIDER_ERROR;

    switch (resultCode) {
      case "-100":
      case "-101":
        code = KMsgErrorCode.AUTHENTICATION_FAILED;
        break;
      case "-102":
      case "-201":
        code = KMsgErrorCode.INSUFFICIENT_BALANCE;
        break;
      case "-103":
      case "-105":
        code = KMsgErrorCode.INVALID_REQUEST;
        break;
      case "-109":
        code = KMsgErrorCode.PROVIDER_ERROR;
        break;
      case "-501":
        code = KMsgErrorCode.TEMPLATE_NOT_FOUND;
        break;
      default:
        code = KMsgErrorCode.PROVIDER_ERROR;
    }

    return new KMsgError(code, `${message} (code: ${resultCode})`);
  }

  getAuthHeaders(): Record<string, string> {
    return {};
  }

  getBaseUrl(): string {
    return this.SMS_HOST;
  }

  getEndpoint(operation: string): string {
    switch (operation) {
      case "send":
      case "sendSMS":
        return "/send/";
      case "sendAlimTalk":
        return "/akv10/alimtalk/send/";
      case "sendFriendTalk":
        return this.aligoConfig.friendtalkEndpoint || "/akv10/friendtalk/send/";
      case "templateList":
        return "/akv10/template/list/";
      case "templateAdd":
        return "/akv10/template/add/";
      case "templateDel":
        return "/akv10/template/del/";
      case "getBalance":
        return "/remain/";
      default:
        return "/";
    }
  }

  /**
   * Aligo 특화 기능: 잔액 조회
   */
  async getBalance(): Promise<number> {
    try {
      const body = {
        key: this.aligoConfig.apiKey,
        user_id: this.aligoConfig.userId,
      };

      const response = await this.request(
        this.SMS_HOST,
        this.getEndpoint("getBalance"),
        body,
      );

      if (response.result_code !== "1") {
        throw this.mapAligoError(response);
      }

      return Number(response.SMS_CNT) || 0;
    } catch (error) {
      this.log("Failed to get balance", error);
      return 0;
    }
  }

  async createTemplate(
    template: Omit<Template, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<Result<Template, KMsgError>> {
    try {
      const body = {
        apikey: this.aligoConfig.apiKey,
        userid: this.aligoConfig.userId,
        senderkey: this.aligoConfig.senderKey,
        tpl_name: template.name,
        tpl_content: template.content,
        tpl_button: template.buttons
          ? JSON.stringify(template.buttons)
          : undefined,
      };

      const response = await this.request(
        this.ALIMTALK_HOST,
        this.getEndpoint("templateAdd"),
        body,
      );
      if (response.result_code !== "0") {
        return fail(this.mapAligoError(response));
      }

      return ok({
        ...template,
        id: template.code,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      return fail(this.handleError(error));
    }
  }

  async updateTemplate(
    _code: string,
    _template: Partial<
      Omit<Template, "id" | "code" | "status" | "createdAt" | "updatedAt">
    >,
  ): Promise<Result<Template, KMsgError>> {
    return fail(
      new KMsgError(
        KMsgErrorCode.UNKNOWN_ERROR,
        "Update not supported by provider directly",
      ),
    );
  }

  async deleteTemplate(code: string): Promise<Result<void, KMsgError>> {
    try {
      const body = {
        apikey: this.aligoConfig.apiKey,
        userid: this.aligoConfig.userId,
        senderkey: this.aligoConfig.senderKey,
        tpl_code: code,
      };

      const response = await this.request(
        this.ALIMTALK_HOST,
        this.getEndpoint("templateDel"),
        body,
      );
      if (response.result_code !== "0") {
        return fail(this.mapAligoError(response));
      }

      return ok(undefined);
    } catch (error) {
      return fail(this.handleError(error));
    }
  }

  async getTemplate(code: string): Promise<Result<Template, KMsgError>> {
    const listResult = await this.listTemplates({ status: undefined });
    if (listResult.isFailure) return listResult as any;

    const template = listResult.value.find((t) => t.code === code);
    if (!template) {
      return fail(
        new KMsgError(KMsgErrorCode.TEMPLATE_NOT_FOUND, "Template not found"),
      );
    }
    return ok(template);
  }

  async listTemplates(_params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<Template[], KMsgError>> {
    try {
      const body = {
        apikey: this.aligoConfig.apiKey,
        userid: this.aligoConfig.userId,
        senderkey: this.aligoConfig.senderKey,
      };

      const response = await this.request(
        this.ALIMTALK_HOST,
        this.getEndpoint("templateList"),
        body,
      );

      if (response.result_code !== "0") {
        return fail(this.mapAligoError(response));
      }

      const list = (response.list || []) as any[];
      const templates: Template[] = list.map((item) => ({
        id: item.templtCode,
        code: item.templtCode,
        name: item.templtName,
        content: item.templtContent,
        status: this.mapTemplateStatus(item.inspectionStatus),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return ok(templates);
    } catch (error) {
      return fail(this.handleError(error));
    }
  }

  private async sendSMS(
    params: SendOptions,
  ): Promise<Result<SendResult, KMsgError>> {
    if (params.type === "ALIMTALK" || params.type === "FRIENDTALK") {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "Invalid type for SMS"),
      );
    }

    const body: AligoSMSRequest = {
      key: this.aligoConfig.apiKey,
      user_id: this.aligoConfig.userId,
      sender: params.from || this.aligoConfig.sender || "",
      receiver: params.to,
      msg: params.text,
      msg_type: params.type,
      title: params.subject,
      testmode_yn: this.aligoConfig.testMode ? "Y" : "N",
    };

    if ((params as any).scheduledAt) {
      const { date, time } = this.formatAligoDate((params as any).scheduledAt);
      body.rdate = date;
      body.rtime = time;
    }

    const response = await this.request(
      this.SMS_HOST,
      this.getEndpoint("sendSMS"),
      body,
    );

    if (response.result_code !== "1") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: response.msg_id || "",
      status: "PENDING",
      provider: this.id,
    });
  }

  private async sendAlimTalk(
    params: SendOptions,
  ): Promise<Result<SendResult, KMsgError>> {
    if (params.type !== "ALIMTALK") {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Invalid type for AlimTalk",
        ),
      );
    }

    if (!this.aligoConfig.senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Sender key required for AlimTalk",
        ),
      );
    }

    const body: any = {
      apikey: this.aligoConfig.apiKey,
      userid: this.aligoConfig.userId,
      senderkey: this.aligoConfig.senderKey,
      tpl_code: params.templateId,
      sender: params.from || this.aligoConfig.sender || "",
      receiver_1: params.to,
      subject_1: "알림톡",
      message_1: this.interpolateMessage(params.variables || {}),
      testMode: this.aligoConfig.testMode ? "Y" : "N",
    };

    if (params.type === "ALIMTALK" && (params as any).scheduledAt) {
      const { date, time } = this.formatAligoDate((params as any).scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    const response = await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendAlimTalk"),
      body,
    );

    if (response.result_code !== "0") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: response.msg_id || "",
      status: "PENDING",
      provider: this.id,
    });
  }

  private async sendFriendTalk(
    params: SendOptions,
  ): Promise<Result<SendResult, KMsgError>> {
    if (params.type !== "FRIENDTALK") {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Invalid type for FriendTalk",
        ),
      );
    }

    if (!this.aligoConfig.senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Sender key required for FriendTalk",
        ),
      );
    }

    const body = this.buildFriendTalkBody({
      to: params.to,
      from: params.from,
      text: params.text,
      imageUrl: params.imageUrl,
      buttons: params.buttons,
      subject: (params as any).subject,
      scheduledAt: (params as any).scheduledAt,
    });

    const response = await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendFriendTalk"),
      body,
    );

    if (response.result_code !== "0") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: response.msg_id || "",
      status: "PENDING",
      provider: this.id,
    });
  }

  private formatAligoDate(date: Date): { date: string; time: string } {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return {
      date: `${year}${month}${day}`,
      time: `${hours}${minutes}`,
    };
  }

  private async request(
    host: string,
    endpoint: string,
    data: any,
  ): Promise<any> {
    const formData = new FormData();
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    }

    const response = await fetch(`${host}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        `HTTP error! status: ${response.status}`,
      );
    }

    return response.json();
  }

  private handleError(error: any): KMsgError {
    if (error instanceof KMsgError) return error;
    return new KMsgError(KMsgErrorCode.NETWORK_ERROR, String(error));
  }

  private toProviderChannel(
    channel: AligoStandardChannel,
  ): "alimtalk" | "friendtalk" | "sms" | "mms" {
    if (channel === "ALIMTALK") return "alimtalk";
    if (channel === "FRIENDTALK") return "friendtalk";
    if (channel === "MMS") return "mms";
    return "sms";
  }

  private normalizeChannelLike(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    return value.trim().toUpperCase();
  }

  private resolveStandardChannel(
    request: StandardRequest,
  ): AligoStandardChannel {
    const normalizedChannel = this.normalizeChannelLike(request.channel);
    const normalizedOptionChannel = this.normalizeChannelLike(
      request.options?.channel,
    );
    const normalizedTemplateCode = this.normalizeChannelLike(
      request.templateCode,
    );

    const channel = normalizedChannel || normalizedOptionChannel;

    if (channel === "MMS") return "MMS";
    if (channel === "LMS") return "LMS";
    if (channel === "SMS") return "SMS";
    if (channel === "FRIENDTALK") return "FRIENDTALK";
    if (channel === "ALIMTALK") return "ALIMTALK";

    if (normalizedTemplateCode === "MMS_DIRECT") return "MMS";
    if (normalizedTemplateCode === "LMS_DIRECT") return "LMS";
    if (normalizedTemplateCode === "SMS_DIRECT") return "SMS";
    if (normalizedTemplateCode === "FRIENDTALK_DIRECT") return "FRIENDTALK";

    if (
      normalizedTemplateCode &&
      AligoAdapter.directTemplates.has(normalizedTemplateCode)
    ) {
      return "SMS";
    }

    return "ALIMTALK";
  }

  private extractStandardMessage(request: StandardRequest): string {
    const variables = request.variables || {};
    if (typeof request.text === "string") {
      return request.text;
    }
    if (typeof variables.message === "string") {
      return variables.message;
    }
    return this.interpolateMessage(variables, (request as any).templateContent);
  }

  private buildSmsBodyFromStandard(
    request: StandardRequest,
    channel: "SMS" | "LMS" | "MMS",
  ): AligoSMSRequest {
    const body: AligoSMSRequest = {
      key: this.aligoConfig.apiKey,
      user_id: this.aligoConfig.userId,
      sender: request.options?.senderNumber || this.aligoConfig.sender || "",
      receiver: request.phoneNumber,
      msg: this.extractStandardMessage(request),
      msg_type: channel,
      title:
        request.options?.subject ||
        (typeof request.variables?.subject === "string"
          ? request.variables.subject
          : undefined),
      testmode_yn: this.aligoConfig.testMode ? "Y" : "N",
    };

    if (request.options?.scheduledAt) {
      const { date, time } = this.formatAligoDate(request.options.scheduledAt);
      body.rdate = date;
      body.rtime = time;
    }

    if (channel === "MMS" && request.imageUrl) {
      body.image = request.imageUrl;
    }

    return body;
  }

  private isKakaoChannel(channel: AligoStandardChannel): boolean {
    return channel === "ALIMTALK" || channel === "FRIENDTALK";
  }

  private buildFriendTalkBody(params: {
    to: string;
    from?: string;
    text: string;
    imageUrl?: string;
    buttons?: unknown;
    subject?: string;
    scheduledAt?: Date;
    templateCode?: string;
  }): Record<string, unknown> {
    const body: Record<string, unknown> = {
      apikey: this.aligoConfig.apiKey,
      userid: this.aligoConfig.userId,
      senderkey: this.aligoConfig.senderKey,
      sender: params.from || this.aligoConfig.sender || "",
      receiver_1: params.to,
      subject_1: params.subject || "친구톡",
      message_1: params.text,
      testMode: this.aligoConfig.testMode ? "Y" : "N",
    };

    if (
      params.templateCode &&
      this.normalizeChannelLike(params.templateCode) !== "FRIENDTALK_DIRECT"
    ) {
      body.tpl_code = params.templateCode;
    }

    if (params.imageUrl) {
      body.image_1 = params.imageUrl;
    }

    if (params.buttons) {
      body.button_1 = JSON.stringify(params.buttons);
    }

    if (params.scheduledAt) {
      const { date, time } = this.formatAligoDate(params.scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    return body;
  }

  private buildAlimTalkBodyFromStandard(
    request: StandardRequest,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      apikey: this.aligoConfig.apiKey,
      userid: this.aligoConfig.userId,
      senderkey: this.aligoConfig.senderKey,
      tpl_code: request.templateCode,
      sender: request.options?.senderNumber || this.aligoConfig.sender || "",
      receiver_1: request.phoneNumber,
      subject_1:
        request.options?.subject ||
        (typeof request.variables?.subject === "string"
          ? request.variables.subject
          : "알림톡"),
      message_1: this.extractStandardMessage(request),
      testMode: this.aligoConfig.testMode ? "Y" : "N",
    };

    if (request.options?.scheduledAt) {
      const { date, time } = this.formatAligoDate(request.options.scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    return body;
  }

  private buildFriendTalkBodyFromStandard(
    request: StandardRequest,
  ): Record<string, unknown> {
    const text = this.extractStandardMessage(request);
    const subject =
      request.options?.subject ||
      (typeof request.variables?.subject === "string"
        ? request.variables.subject
        : undefined);
    const buttons =
      request.buttons ??
      (Array.isArray(request.options?.buttons)
        ? request.options?.buttons
        : undefined);
    const imageUrl =
      request.imageUrl ||
      (typeof request.options?.imageUrl === "string"
        ? request.options.imageUrl
        : undefined);

    return this.buildFriendTalkBody({
      to: request.phoneNumber,
      from: request.options?.senderNumber,
      text,
      subject,
      buttons,
      imageUrl,
      scheduledAt: request.options?.scheduledAt,
      templateCode: request.templateCode,
    });
  }

  private interpolateMessage(
    variables: Record<string, any>,
    templateContent?: string,
  ): string {
    if (variables._full_text) return String(variables._full_text);
    if (!templateContent) return Object.values(variables).join("\n");

    let result = templateContent;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`#{${key}}`, "g"), String(value));
    }
    return result;
  }

  private mapTemplateStatus(
    status: string,
  ): "APPROVED" | "PENDING" | "REJECTED" {
    switch (status) {
      case "REG":
        return "PENDING";
      case "APR":
        return "APPROVED";
      case "REJ":
        return "REJECTED";
      default:
        return "PENDING";
    }
  }
}
