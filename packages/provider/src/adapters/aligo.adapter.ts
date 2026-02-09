import {
  BaseProviderAdapter,
  fail,
  KMsgError,
  KMsgErrorCode,
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

export class AligoAdapter
  extends BaseProviderAdapter
  implements Provider, TemplateProvider
{
  readonly id = "aligo";
  readonly name = "Aligo Smart SMS";

  private readonly SMS_HOST = "https://apis.aligo.in";
  private readonly ALIMTALK_HOST = "https://kakaoapi.aligo.in";

  constructor(protected readonly aligoConfig: AligoConfig) {
    super({
      baseUrl: "https://apis.aligo.in",
      ...aligoConfig,
    });
  }

  async send(params: SendOptions): Promise<Result<SendResult, KMsgError>> {
    try {
      if (params.type === "ALIMTALK") {
        return this.sendAlimTalk(params);
      }
      return this.sendSMS(params);
    } catch (error) {
      return fail(this.handleError(error));
    }
  }

  adaptRequest(request: StandardRequest): any {
    return {
      apikey: this.aligoConfig.apiKey,
      userid: this.aligoConfig.userId,
      tpl_code: request.templateCode,
      receiver_1: request.phoneNumber,
      subject_1: request.options?.subject || "알림톡",
      message_1: request.variables
        ? this.interpolateMessage(request.variables)
        : "",
    };
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
      case "sendSMS":
        return "/send/";
      case "sendAlimTalk":
        return "/akv10/alimtalk/send/";
      case "templateList":
        return "/akv10/template/list/";
      case "templateAdd":
        return "/akv10/template/add/";
      case "templateDel":
        return "/akv10/template/del/";
      default:
        return "/";
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
      message_1: params.variables
        ? this.interpolateMessage(params.variables)
        : "",
      testMode: this.aligoConfig.testMode ? "Y" : "N",
    };

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

  private interpolateMessage(variables: Record<string, string>): string {
    return Object.values(variables).join("\n");
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
