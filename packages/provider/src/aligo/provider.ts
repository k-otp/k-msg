import {
  fail,
  type KakaoCategoryEntry,
  type KakaoChannel,
  type KakaoChannelCategories,
  type KakaoChannelProvider,
  KMsgError,
  KMsgErrorCode,
  type MessageBinaryInput,
  type MessageType,
  ok,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendOptions,
  type SendResult,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateInspectionProvider,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";
import { getProviderOnboardingSpec } from "../onboarding/specs";
import { isObjectRecord } from "../shared/type-guards";
import type {
  AligoConfig,
  AligoResponse,
  AligoSMSRequest,
} from "./types/aligo";

type AligoMessageType = "SMS" | "LMS" | "MMS" | "ALIMTALK" | "FRIENDTALK";

export class AligoProvider
  implements
    Provider,
    TemplateProvider,
    TemplateInspectionProvider,
    KakaoChannelProvider
{
  readonly id = "aligo";
  readonly name = "Aligo Smart SMS";
  readonly supportedTypes: readonly MessageType[] = [
    "ALIMTALK",
    "FRIENDTALK",
    "SMS",
    "LMS",
    "MMS",
  ];

  private readonly SMS_HOST: string;
  private readonly ALIMTALK_HOST: string;

  getOnboardingSpec() {
    const spec = getProviderOnboardingSpec(this.id);
    if (!spec) {
      throw new Error(`Onboarding spec missing for provider: ${this.id}`);
    }
    return spec;
  }

  constructor(private readonly config: AligoConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("AligoProvider requires a config object");
    }
    if (!config.apiKey || config.apiKey.length === 0) {
      throw new Error("AligoProvider requires `apiKey`");
    }
    if (!config.userId || config.userId.length === 0) {
      throw new Error("AligoProvider requires `userId`");
    }

    this.SMS_HOST = config.smsBaseUrl || "https://apis.aligo.in";
    this.ALIMTALK_HOST = config.alimtalkBaseUrl || "https://kakaoapi.aligo.in";
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    const issues: string[] = [];

    try {
      if (!this.config.apiKey) issues.push("Missing apiKey");
      if (!this.config.userId) issues.push("Missing userId");
      if (!this.config.sender) {
        issues.push("Missing sender (default from)");
      }

      try {
        new URL(this.SMS_HOST);
      } catch {
        issues.push("Invalid smsBaseUrl");
      }

      try {
        new URL(this.ALIMTALK_HOST);
      } catch {
        issues.push("Invalid alimtalkBaseUrl");
      }

      return {
        healthy: issues.length === 0,
        issues,
        latencyMs: Date.now() - start,
        data: {
          provider: this.id,
          smsBaseUrl: this.SMS_HOST,
          alimtalkBaseUrl: this.ALIMTALK_HOST,
        },
      };
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
      return { healthy: false, issues, latencyMs: Date.now() - start };
    }
  }

  async send(options: SendOptions): Promise<Result<SendResult, KMsgError>> {
    const messageId = options.messageId || crypto.randomUUID();
    const normalized = { ...options, messageId } as SendOptions;

    try {
      switch (normalized.type as AligoMessageType) {
        case "ALIMTALK":
          return await this.sendAlimTalk(
            normalized as Extract<SendOptions, { type: "ALIMTALK" }>,
          );
        case "FRIENDTALK":
          return await this.sendFriendTalk(
            normalized as Extract<SendOptions, { type: "FRIENDTALK" }>,
          );
        case "SMS":
        case "LMS":
        case "MMS":
          return await this.sendSMS(
            normalized as Extract<SendOptions, { type: "SMS" | "LMS" | "MMS" }>,
          );
        default:
          return fail(
            new KMsgError(
              KMsgErrorCode.INVALID_REQUEST,
              `AligoProvider does not support type ${normalized.type}`,
              { providerId: this.id, type: normalized.type },
            ),
          );
      }
    } catch (error) {
      return fail(this.mapAligoError(error));
    }
  }

  async listKakaoChannels(params?: {
    plusId?: string;
    senderKey?: string;
  }): Promise<Result<KakaoChannel[], KMsgError>> {
    try {
      const body: Record<string, unknown> = {
        apikey: this.config.apiKey,
        userid: this.config.userId,
        ...(typeof params?.plusId === "string" &&
        params.plusId.trim().length > 0
          ? { plusid: params.plusId.trim() }
          : {}),
        ...(typeof params?.senderKey === "string" &&
        params.senderKey.trim().length > 0
          ? { senderkey: params.senderKey.trim() }
          : {}),
      };

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/profile/list/",
        body,
      );

      const okResult = this.ensureAligoKakaoOk(response, "channel list failed");
      if (okResult.isFailure) return okResult;

      const listRaw = response.list;
      const list = Array.isArray(listRaw) ? listRaw : [];
      const channels: KakaoChannel[] = list
        .filter(isObjectRecord)
        .map((item) => ({
          providerId: this.id,
          senderKey: String(item.senderKey ?? ""),
          plusId: typeof item.uuid === "string" ? item.uuid : undefined,
          name: typeof item.name === "string" ? item.name : undefined,
          status: typeof item.status === "string" ? item.status : undefined,
          createdAt: this.parseAligoDateTime(item.cdate),
          updatedAt: this.parseAligoDateTime(item.udate),
          raw: item,
        }))
        .filter((c) => c.senderKey.length > 0);

      return ok(channels);
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async listKakaoChannelCategories(): Promise<
    Result<KakaoChannelCategories, KMsgError>
  > {
    try {
      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/category/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
        },
      );

      const okResult = this.ensureAligoKakaoOk(
        response,
        "category list failed",
      );
      if (okResult.isFailure) return okResult;

      const data = isObjectRecord(response.data) ? response.data : {};

      const mapEntries = (raw: unknown): KakaoCategoryEntry[] => {
        const arr = Array.isArray(raw) ? raw : [];
        return arr
          .filter(isObjectRecord)
          .map((entry) => ({
            code: String(entry.code ?? ""),
            name: String(entry.name ?? ""),
            parentCode:
              typeof entry.parentCode === "string" &&
              entry.parentCode.length > 0
                ? entry.parentCode
                : undefined,
          }))
          .filter((e) => e.code.length > 0);
      };

      return ok({
        first: mapEntries(data.firstBusinessType),
        second: mapEntries(data.secondBusinessType),
        third: mapEntries(data.thirdBusinessType),
      });
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async requestKakaoChannelAuth(params: {
    plusId: string;
    phoneNumber: string;
  }): Promise<Result<void, KMsgError>> {
    try {
      const plusId = params.plusId.trim();
      const phoneNumber = params.phoneNumber.trim();
      if (!plusId || !phoneNumber) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "plusId and phoneNumber are required",
            { providerId: this.id },
          ),
        );
      }

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/profile/auth/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
          plusid: plusId,
          phonenumber: phoneNumber,
        },
      );

      const okResult = this.ensureAligoKakaoOk(response, "channel auth failed");
      if (okResult.isFailure) return okResult;
      return ok(undefined);
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async addKakaoChannel(params: {
    plusId: string;
    authNum: string;
    phoneNumber: string;
    categoryCode: string;
  }): Promise<Result<KakaoChannel, KMsgError>> {
    try {
      const plusId = params.plusId.trim();
      const authNum = params.authNum.trim();
      const phoneNumber = params.phoneNumber.trim();
      const categoryCode = params.categoryCode.trim();
      if (!plusId || !authNum || !phoneNumber || !categoryCode) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "plusId, authNum, phoneNumber, categoryCode are required",
            { providerId: this.id },
          ),
        );
      }

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/profile/add/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
          plusid: plusId,
          authnum: authNum,
          phonenumber: phoneNumber,
          categorycode: categoryCode,
        },
      );

      const okResult = this.ensureAligoKakaoOk(response, "channel add failed");
      if (okResult.isFailure) return okResult;

      const dataRaw = response.data;
      const data = Array.isArray(dataRaw)
        ? dataRaw.find(isObjectRecord)
        : isObjectRecord(dataRaw)
          ? dataRaw
          : undefined;
      if (!data) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "channel add returned empty data",
            { providerId: this.id, raw: response },
          ),
        );
      }

      const senderKey = String(data.senderKey ?? "");
      if (!senderKey) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "channel add did not return senderKey",
            { providerId: this.id, raw: data },
          ),
        );
      }

      return ok({
        providerId: this.id,
        senderKey,
        plusId: typeof data.uuid === "string" ? data.uuid : plusId,
        name: typeof data.name === "string" ? data.name : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
        createdAt: this.parseAligoDateTime(data.cdate),
        updatedAt: this.parseAligoDateTime(data.udate),
        raw: data,
      });
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async createTemplate(
    input: TemplateCreateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    try {
      const senderKey = this.resolveKakaoSenderKey(ctx);
      if (!input.name || input.name.trim().length === 0) {
        return fail(
          new KMsgError(KMsgErrorCode.INVALID_REQUEST, "name is required", {
            providerId: this.id,
          }),
        );
      }
      if (!input.content || input.content.trim().length === 0) {
        return fail(
          new KMsgError(KMsgErrorCode.INVALID_REQUEST, "content is required", {
            providerId: this.id,
          }),
        );
      }

      const body: Record<string, unknown> = {
        apikey: this.config.apiKey,
        userid: this.config.userId,
        senderkey: senderKey,
        tpl_name: input.name,
        tpl_content: input.content,
      };

      const tplButton = this.toAligoTplButton(input.buttons);
      if (tplButton) body.tpl_button = tplButton;

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/template/add/",
        body,
      );

      const okResult = this.ensureAligoKakaoOk(
        response,
        "template create failed",
      );
      if (okResult.isFailure) return okResult;

      const data = isObjectRecord(response.data) ? response.data : {};
      const code = String(data.templtCode ?? "");
      if (!code) {
        return fail(
          new KMsgError(
            KMsgErrorCode.PROVIDER_ERROR,
            "template create did not return templtCode",
            { providerId: this.id, raw: response },
          ),
        );
      }

      const createdAt = this.parseAligoDateTime(data.cdate) ?? new Date();
      const updatedAt =
        this.parseAligoDateTime(data.udate) ??
        this.parseAligoDateTime(data.cdate) ??
        createdAt;

      return ok({
        id: code,
        code,
        name: String(data.templtName ?? input.name),
        content: String(data.templtContent ?? input.content),
        category: input.category,
        status: this.mapAligoTemplateStatus(data),
        buttons: Array.isArray(data.buttons) ? data.buttons : input.buttons,
        variables: input.variables,
        createdAt,
        updatedAt,
      });
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async updateTemplate(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    try {
      const senderKey = this.resolveKakaoSenderKey(ctx);
      const templateCode = code.trim();
      if (!templateCode) {
        return fail(
          new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
            providerId: this.id,
          }),
        );
      }

      const existingResult = await this.getTemplate(templateCode, {
        kakaoChannelSenderKey: senderKey,
      });
      if (existingResult.isFailure) return existingResult;
      const existing = existingResult.value;

      const nextName =
        typeof patch.name === "string" && patch.name.trim().length > 0
          ? patch.name.trim()
          : existing.name;
      const nextContent =
        typeof patch.content === "string" && patch.content.trim().length > 0
          ? patch.content
          : existing.content;
      const nextButtons =
        patch.buttons !== undefined ? patch.buttons : existing.buttons;

      const body: Record<string, unknown> = {
        apikey: this.config.apiKey,
        userid: this.config.userId,
        senderkey: senderKey,
        tpl_code: templateCode,
        tpl_name: nextName,
        tpl_content: nextContent,
      };

      const tplButton = this.toAligoTplButton(nextButtons);
      if (tplButton) body.tpl_button = tplButton;

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/template/modify/",
        body,
      );

      const okResult = this.ensureAligoKakaoOk(
        response,
        "template update failed",
      );
      if (okResult.isFailure) return okResult;

      const refreshed = await this.getTemplate(templateCode, {
        kakaoChannelSenderKey: senderKey,
      });
      if (refreshed.isSuccess) return refreshed;

      return ok({
        ...existing,
        name: nextName,
        content: nextContent,
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.variables !== undefined
          ? { variables: patch.variables }
          : {}),
        ...(patch.buttons !== undefined ? { buttons: patch.buttons } : {}),
        updatedAt: new Date(),
      });
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async deleteTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    try {
      const senderKey = this.resolveKakaoSenderKey(ctx);
      const templateCode = code.trim();
      if (!templateCode) {
        return fail(
          new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
            providerId: this.id,
          }),
        );
      }

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/template/del/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
          senderkey: senderKey,
          tpl_code: templateCode,
        },
      );

      const okResult = this.ensureAligoKakaoOk(
        response,
        "template delete failed",
      );
      if (okResult.isFailure) return okResult;
      return ok(undefined);
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async getTemplate(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    try {
      const senderKey = this.resolveKakaoSenderKey(ctx);
      const templateCode = code.trim();
      if (!templateCode) {
        return fail(
          new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
            providerId: this.id,
          }),
        );
      }

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/template/list/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
          senderkey: senderKey,
          tpl_code: templateCode,
        },
      );

      const okResult = this.ensureAligoKakaoOk(response, "template get failed");
      if (okResult.isFailure) return okResult;

      const listRaw = response.list;
      const list = Array.isArray(listRaw) ? listRaw : [];
      const first = list.find(isObjectRecord);
      if (!first) {
        return fail(
          new KMsgError(
            KMsgErrorCode.TEMPLATE_NOT_FOUND,
            "Template not found",
            {
              providerId: this.id,
              templateCode,
            },
          ),
        );
      }

      const tplCode = String(first.templtCode ?? templateCode);
      const createdAt = this.parseAligoDateTime(first.cdate) ?? new Date();
      const updatedAt =
        this.parseAligoDateTime(first.udate) ??
        this.parseAligoDateTime(first.cdate) ??
        createdAt;

      return ok({
        id: tplCode,
        code: tplCode,
        name: String(first.templtName ?? ""),
        content: String(first.templtContent ?? ""),
        status: this.mapAligoTemplateStatus(first),
        buttons: Array.isArray(first.buttons) ? first.buttons : undefined,
        createdAt,
        updatedAt,
      });
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async listTemplates(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
    try {
      const senderKey = this.resolveKakaoSenderKey(ctx);
      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/template/list/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
          senderkey: senderKey,
        },
      );

      const okResult = this.ensureAligoKakaoOk(
        response,
        "template list failed",
      );
      if (okResult.isFailure) return okResult;

      const listRaw = response.list;
      const list = Array.isArray(listRaw) ? listRaw : [];
      const templates = list
        .filter(isObjectRecord)
        .map((item) => {
          const tplCode = String(item.templtCode ?? "");
          const createdAt = this.parseAligoDateTime(item.cdate) ?? new Date();
          const updatedAt =
            this.parseAligoDateTime(item.udate) ??
            this.parseAligoDateTime(item.cdate) ??
            createdAt;

          return {
            id: tplCode,
            code: tplCode,
            name: String(item.templtName ?? ""),
            content: String(item.templtContent ?? ""),
            status: this.mapAligoTemplateStatus(item),
            buttons: Array.isArray(item.buttons) ? item.buttons : undefined,
            createdAt,
            updatedAt,
          } satisfies Template;
        })
        .filter((tpl) => tpl.code.length > 0);

      if (params?.status) {
        const status = params.status.trim().toUpperCase();
        return ok(templates.filter((tpl) => tpl.status === status));
      }

      return ok(templates);
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  async requestTemplateInspection(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    try {
      const senderKey = this.resolveKakaoSenderKey(ctx);
      const templateCode = code.trim();
      if (!templateCode) {
        return fail(
          new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
            providerId: this.id,
          }),
        );
      }

      const response = await this.request(
        this.ALIMTALK_HOST,
        "/akv10/template/request/",
        {
          apikey: this.config.apiKey,
          userid: this.config.userId,
          senderkey: senderKey,
          tpl_code: templateCode,
        },
      );

      const okResult = this.ensureAligoKakaoOk(
        response,
        "template inspection request failed",
      );
      if (okResult.isFailure) return okResult;
      return ok(undefined);
    } catch (error) {
      return fail(this.mapAligoKakaoError(error));
    }
  }

  private resolveImageRef(options: {
    imageUrl?: string;
    media?: { image?: MessageBinaryInput };
  }): string | undefined {
    const imageUrl =
      typeof options.imageUrl === "string" && options.imageUrl.trim().length > 0
        ? options.imageUrl.trim()
        : undefined;
    if (imageUrl) return imageUrl;

    const image = options.media?.image;
    if (!image) return undefined;

    if ("ref" in image) {
      const ref = image.ref.trim();
      return ref.length > 0 ? ref : undefined;
    }

    throw new KMsgError(
      KMsgErrorCode.INVALID_REQUEST,
      "Aligo MMS/FriendTalk image requires `options.imageUrl` or `options.media.image.ref` (url/path).",
      { providerId: this.id },
    );
  }

  private getEndpoint(operation: string): string {
    switch (operation) {
      case "sendSMS":
        return "/send/";
      case "sendAlimTalk":
        return "/akv10/alimtalk/send/";
      case "sendFriendTalk":
        return this.config.friendtalkEndpoint || "/akv10/friendtalk/send/";
      default:
        return "/";
    }
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
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
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
        { providerId: this.id },
      );
    }

    return (await response.json()) as Record<string, unknown>;
  }

  private normalizeAligoKakaoCode(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const num = Number(trimmed);
      if (Number.isFinite(num)) return num;
    }
    return undefined;
  }

  private ensureAligoKakaoOk(
    response: Record<string, unknown>,
    fallbackMessage: string,
  ): Result<void, KMsgError> {
    const rawCode = response.code;
    const code = this.normalizeAligoKakaoCode(rawCode);
    if (code === 0) return ok(undefined);

    const message =
      typeof response.message === "string" && response.message.length > 0
        ? response.message
        : fallbackMessage;
    const mapped =
      code === 509 || code === -99
        ? KMsgErrorCode.INVALID_REQUEST
        : KMsgErrorCode.PROVIDER_ERROR;
    return fail(
      new KMsgError(mapped, message, {
        providerId: this.id,
        originalCode: rawCode,
        raw: response,
      }),
    );
  }

  private resolveKakaoSenderKey(ctx?: TemplateContext): string {
    const senderKey =
      (typeof ctx?.kakaoChannelSenderKey === "string" &&
      ctx.kakaoChannelSenderKey.trim().length > 0
        ? ctx.kakaoChannelSenderKey.trim()
        : this.config.senderKey) || "";
    if (!senderKey) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "kakao channel senderKey is required (ctx.kakaoChannelSenderKey or config.senderKey)",
        { providerId: this.id },
      );
    }
    return senderKey;
  }

  private toAligoTplButton(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (Array.isArray(value)) {
      return JSON.stringify({ button: value });
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return undefined;
  }

  private mapAligoTemplateStatus(
    item: Record<string, unknown>,
  ): Template["status"] {
    const insp =
      typeof item.inspStatus === "string"
        ? item.inspStatus.trim().toUpperCase()
        : "";
    switch (insp) {
      case "APR":
        return "APPROVED";
      case "REJ":
        return "REJECTED";
      case "REQ":
      case "REG":
        return "INSPECTION";
      default:
        return "PENDING";
    }
  }

  private parseAligoDateTime(value: unknown): Date | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
      trimmed,
    );
    if (!match) return undefined;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6]);

    const date = new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private mapAligoKakaoError(error: unknown): KMsgError {
    if (error instanceof KMsgError) return error;
    return new KMsgError(
      KMsgErrorCode.PROVIDER_ERROR,
      error instanceof Error ? error.message : String(error),
      { providerId: this.id },
    );
  }

  private mapAligoError(error: unknown): KMsgError {
    if (error instanceof KMsgError) return error;

    const record = isObjectRecord(error) ? error : {};
    const resultCodeRaw = record.result_code;
    const resultCode =
      resultCodeRaw !== undefined && resultCodeRaw !== null
        ? String(resultCodeRaw)
        : "UNKNOWN";

    const message =
      typeof record.message === "string" && record.message.length > 0
        ? record.message
        : typeof record.msg === "string" && record.msg.length > 0
          ? record.msg
          : error instanceof Error
            ? error.message
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
      case "-501":
        code = KMsgErrorCode.TEMPLATE_NOT_FOUND;
        break;
      default:
        code = KMsgErrorCode.PROVIDER_ERROR;
    }

    return new KMsgError(code, `${message} (code: ${resultCode})`, {
      providerId: this.id,
      resultCode,
    });
  }

  private collectSendWarnings(options: SendOptions): SendResult["warnings"] {
    if (options.type !== "ALIMTALK") return undefined;
    if (options.failover?.enabled !== true) return undefined;

    return [
      {
        code: "FAILOVER_PARTIAL_PROVIDER",
        message:
          "Aligo failover mapping is partial. API-level fallback may be attempted for non-Kakao-user failures.",
        details: {
          providerId: this.id,
          mappedFields: ["failover", "fmessage_1", "fsubject_1"],
          unsupportedFields: ["fallbackChannel"],
        },
      },
    ];
  }

  private interpolateMessage(
    variables: Record<string, unknown> | undefined,
    templateContent?: string,
  ): string {
    if (!variables) return "";
    const fullText = variables._full_text;
    if (fullText !== undefined && fullText !== null) return String(fullText);
    if (!templateContent)
      return Object.values(variables).map(String).join("\n");

    let result = templateContent;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`#{${key}}`, "g"), String(value));
    }
    return result;
  }

  private async sendSMS(
    options: Extract<SendOptions, { type: "SMS" | "LMS" | "MMS" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    const sender = options.from || this.config.sender || "";
    if (!sender) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for SMS/LMS/MMS (options.from or config.sender)",
          { providerId: this.id },
        ),
      );
    }

    const body: AligoSMSRequest = {
      key: this.config.apiKey,
      user_id: this.config.userId,
      sender,
      receiver: options.to,
      msg: options.text,
      msg_type: options.type,
      title: options.subject,
      testmode_yn: this.config.testMode ? "Y" : "N",
    };

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.rdate = date;
      body.rtime = time;
    }

    if (options.type === "MMS") {
      const imageRef = this.resolveImageRef(options);
      if (!imageRef) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            "image is required for MMS (options.imageUrl or options.media.image.ref)",
            { providerId: this.id },
          ),
        );
      }
      body.image = imageRef;
    }

    const response = (await this.request(
      this.SMS_HOST,
      this.getEndpoint("sendSMS"),
      body as unknown as Record<string, unknown>,
    )) as unknown as AligoResponse;

    if (response.result_code !== "1") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId: response.msg_id,
      status: "PENDING",
      type: options.type,
      to: options.to,
      raw: response,
    });
  }

  private async sendAlimTalk(
    options: Extract<SendOptions, { type: "ALIMTALK" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    const warnings = this.collectSendWarnings(options);
    const senderKey =
      (typeof options.kakao?.profileId === "string"
        ? options.kakao.profileId
        : this.config.senderKey) || "";
    if (!senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.senderKey)",
          { providerId: this.id },
        ),
      );
    }

    const sender = options.from || this.config.sender || "";
    if (!sender) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for ALIMTALK (options.from or config.sender)",
          { providerId: this.id },
        ),
      );
    }

    const variables = options.variables as Record<string, unknown>;
    const templateContent =
      typeof options.providerOptions?.templateContent === "string"
        ? options.providerOptions.templateContent
        : undefined;

    const body: Record<string, unknown> = {
      apikey: this.config.apiKey,
      userid: this.config.userId,
      senderkey: senderKey,
      tpl_code: options.templateCode,
      sender,
      receiver_1: options.to,
      subject_1: "알림톡",
      message_1: this.interpolateMessage(variables, templateContent),
      testMode: this.config.testMode ? "Y" : "N",
    };

    const failoverOverrideRaw =
      typeof options.providerOptions?.failover === "string"
        ? options.providerOptions.failover.trim().toUpperCase()
        : "";
    const failoverOverride =
      failoverOverrideRaw === "Y" || failoverOverrideRaw === "N"
        ? failoverOverrideRaw
        : undefined;
    const failoverFromOptions =
      options.failover?.enabled === true
        ? "Y"
        : options.failover?.enabled === false
          ? "N"
          : undefined;
    const failover = failoverOverride ?? failoverFromOptions;

    const fallbackTitle =
      typeof options.providerOptions?.fsubject_1 === "string" &&
      options.providerOptions.fsubject_1.trim().length > 0
        ? options.providerOptions.fsubject_1.trim()
        : typeof options.failover?.fallbackTitle === "string" &&
            options.failover.fallbackTitle.trim().length > 0
          ? options.failover.fallbackTitle.trim()
          : undefined;
    const fallbackContent =
      typeof options.providerOptions?.fmessage_1 === "string" &&
      options.providerOptions.fmessage_1.trim().length > 0
        ? options.providerOptions.fmessage_1.trim()
        : typeof options.failover?.fallbackContent === "string" &&
            options.failover.fallbackContent.trim().length > 0
          ? options.failover.fallbackContent.trim()
          : undefined;
    if (failover) {
      body.failover = failover;
    }
    if (fallbackTitle) {
      body.fsubject_1 = fallbackTitle;
    }
    if (fallbackContent) {
      body.fmessage_1 = fallbackContent;
    }

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    const response = (await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendAlimTalk"),
      body,
    )) as unknown as AligoResponse;

    if (response.result_code !== "0") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId: response.msg_id,
      status: "PENDING",
      type: options.type,
      to: options.to,
      ...(Array.isArray(warnings) && warnings.length > 0 ? { warnings } : {}),
      raw: response,
    });
  }

  private async sendFriendTalk(
    options: Extract<SendOptions, { type: "FRIENDTALK" }>,
  ): Promise<Result<SendResult, KMsgError>> {
    const senderKey =
      (typeof options.kakao?.profileId === "string"
        ? options.kakao.profileId
        : this.config.senderKey) || "";
    if (!senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "kakao profileId is required (options.kakao.profileId or config.senderKey)",
          { providerId: this.id },
        ),
      );
    }

    const sender = options.from || this.config.sender || "";
    if (!sender) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "from is required for FRIENDTALK (options.from or config.sender)",
          { providerId: this.id },
        ),
      );
    }

    const body: Record<string, unknown> = {
      apikey: this.config.apiKey,
      userid: this.config.userId,
      senderkey: senderKey,
      sender,
      receiver_1: options.to,
      subject_1: "친구톡",
      message_1: options.text,
      testMode: this.config.testMode ? "Y" : "N",
    };

    const imageRef = this.resolveImageRef(options);
    if (imageRef) {
      body.image_1 = imageRef;
    }

    const buttons = Array.isArray(options.kakao?.buttons)
      ? options.kakao.buttons
      : options.buttons;
    if (buttons) {
      body.button_1 = JSON.stringify(buttons);
    }

    const scheduledAt = options.options?.scheduledAt;
    if (scheduledAt instanceof Date && !Number.isNaN(scheduledAt.getTime())) {
      const { date, time } = this.formatAligoDate(scheduledAt);
      body.reserve = "Y";
      body.reserve_date = date;
      body.reserve_time = time;
    }

    const response = (await this.request(
      this.ALIMTALK_HOST,
      this.getEndpoint("sendFriendTalk"),
      body,
    )) as unknown as AligoResponse;

    if (response.result_code !== "0") {
      return fail(this.mapAligoError(response));
    }

    return ok({
      messageId: options.messageId || crypto.randomUUID(),
      providerId: this.id,
      providerMessageId: response.msg_id,
      status: "PENDING",
      type: options.type,
      to: options.to,
      raw: response,
    });
  }
}

export const createAligoProvider = (config: AligoConfig) =>
  new AligoProvider(config);

export const createDefaultAligoProvider = () => {
  const config: AligoConfig = {
    apiKey: process.env.ALIGO_API_KEY || "",
    userId: process.env.ALIGO_USER_ID || "",
    senderKey: process.env.ALIGO_SENDER_KEY || "",
    sender: process.env.ALIGO_SENDER || "",
    friendtalkEndpoint: process.env.ALIGO_FRIENDTALK_ENDPOINT,
    testMode: process.env.NODE_ENV !== "production",
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey || !config.userId) {
    throw new Error("ALIGO_API_KEY and ALIGO_USER_ID are required");
  }

  return new AligoProvider(config);
};

// biome-ignore lint/complexity/noStaticOnlyClass: kept as a factory for convenience
export class AligoProviderFactory {
  static create(config: AligoConfig): AligoProvider {
    return new AligoProvider(config);
  }

  static createDefault(): AligoProvider {
    return createDefaultAligoProvider();
  }
}

export function initializeAligo(): void {}
