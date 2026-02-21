import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Result,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateUpdateInput,
} from "@k-msg/core";
import { validateTemplatePayload } from "@k-msg/template";
import { isObjectRecord } from "../shared/type-guards";
import { mapAligoKakaoError } from "./aligo.error";
import {
  mapAligoTemplateStatus,
  parseAligoDateTime,
  resolveKakaoSenderKey,
  toAligoTplButton,
} from "./aligo.helpers";
import { ensureAligoKakaoOk, requestAligo } from "./aligo.http";
import type { AligoRuntimeContext } from "./aligo.internal.types";

function withProviderContext(error: KMsgError, providerId: string): KMsgError {
  return new KMsgError(error.code, error.message, {
    providerId,
    ...(error.details ?? {}),
  });
}

export async function createTemplate(
  ctx: AligoRuntimeContext,
  input: TemplateCreateInput,
  templateCtx?: TemplateContext,
): Promise<Result<Template, KMsgError>> {
  try {
    const senderKey = resolveKakaoSenderKey(ctx, templateCtx);
    const payloadValidation = validateTemplatePayload(input, {
      requireName: true,
      requireContent: true,
    });
    if (payloadValidation.isFailure) {
      return fail(withProviderContext(payloadValidation.error, ctx.providerId));
    }

    const body: Record<string, unknown> = {
      apikey: ctx.config.apiKey,
      userid: ctx.config.userId,
      senderkey: senderKey,
      tpl_name: payloadValidation.value.name ?? input.name,
      tpl_content: payloadValidation.value.content ?? input.content,
    };

    const tplButton = toAligoTplButton(payloadValidation.value.buttons);
    if (tplButton) body.tpl_button = tplButton;

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/template/add/",
      data: body,
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "template create failed",
    });
    if (okResult.isFailure) return okResult;

    const data = isObjectRecord(response.data) ? response.data : {};
    const code = String(data.templtCode ?? "");
    if (!code) {
      return fail(
        new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "template create did not return templtCode",
          { providerId: ctx.providerId, raw: response },
        ),
      );
    }

    const createdAt = parseAligoDateTime(data.cdate) ?? new Date();
    const updatedAt =
      parseAligoDateTime(data.udate) ??
      parseAligoDateTime(data.cdate) ??
      createdAt;

    return ok({
      id: code,
      code,
      name: String(data.templtName ?? (payloadValidation.value.name ?? input.name)),
      content: String(
        data.templtContent ?? (payloadValidation.value.content ?? input.content),
      ),
      category: input.category,
      status: mapAligoTemplateStatus(data),
      buttons: Array.isArray(data.buttons)
        ? data.buttons
        : payloadValidation.value.buttons,
      variables: input.variables,
      createdAt,
      updatedAt,
    });
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function getTemplate(
  ctx: AligoRuntimeContext,
  code: string,
  templateCtx?: TemplateContext,
): Promise<Result<Template, KMsgError>> {
  try {
    const senderKey = resolveKakaoSenderKey(ctx, templateCtx);
    const templateCode = code.trim();
    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: ctx.providerId,
        }),
      );
    }

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/template/list/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
        senderkey: senderKey,
        tpl_code: templateCode,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "template get failed",
    });
    if (okResult.isFailure) return okResult;

    const listRaw = response.list;
    const list = Array.isArray(listRaw) ? listRaw : [];
    const first = list.find(isObjectRecord);
    if (!first) {
      return fail(
        new KMsgError(KMsgErrorCode.TEMPLATE_NOT_FOUND, "Template not found", {
          providerId: ctx.providerId,
          templateCode,
        }),
      );
    }

    const tplCode = String(first.templtCode ?? templateCode);
    const createdAt = parseAligoDateTime(first.cdate) ?? new Date();
    const updatedAt =
      parseAligoDateTime(first.udate) ??
      parseAligoDateTime(first.cdate) ??
      createdAt;

    return ok({
      id: tplCode,
      code: tplCode,
      name: String(first.templtName ?? ""),
      content: String(first.templtContent ?? ""),
      status: mapAligoTemplateStatus(first),
      buttons: Array.isArray(first.buttons) ? first.buttons : undefined,
      createdAt,
      updatedAt,
    });
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function updateTemplate(
  ctx: AligoRuntimeContext,
  code: string,
  patch: TemplateUpdateInput,
  templateCtx?: TemplateContext,
): Promise<Result<Template, KMsgError>> {
  try {
    const senderKey = resolveKakaoSenderKey(ctx, templateCtx);
    const templateCode = code.trim();
    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: ctx.providerId,
        }),
      );
    }

    const existingResult = await getTemplate(ctx, templateCode, {
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
    const payloadValidation = validateTemplatePayload(
      {
        name: nextName,
        content: nextContent,
        buttons: patch.buttons !== undefined ? patch.buttons : existing.buttons,
      },
      {
        requireName: true,
        requireContent: true,
      },
    );
    if (payloadValidation.isFailure) {
      return fail(withProviderContext(payloadValidation.error, ctx.providerId));
    }

    const body: Record<string, unknown> = {
      apikey: ctx.config.apiKey,
      userid: ctx.config.userId,
      senderkey: senderKey,
      tpl_code: templateCode,
      tpl_name: payloadValidation.value.name ?? nextName,
      tpl_content: payloadValidation.value.content ?? nextContent,
    };

    const tplButton = toAligoTplButton(payloadValidation.value.buttons);
    if (tplButton) body.tpl_button = tplButton;

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/template/modify/",
      data: body,
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "template update failed",
    });
    if (okResult.isFailure) return okResult;

    const refreshed = await getTemplate(ctx, templateCode, {
      kakaoChannelSenderKey: senderKey,
    });
    if (refreshed.isSuccess) return refreshed;

    return ok({
      ...existing,
      name: payloadValidation.value.name ?? nextName,
      content: payloadValidation.value.content ?? nextContent,
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.variables !== undefined ? { variables: patch.variables } : {}),
      ...(patch.buttons !== undefined
        ? { buttons: payloadValidation.value.buttons }
        : {}),
      updatedAt: new Date(),
    });
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function deleteTemplate(
  ctx: AligoRuntimeContext,
  code: string,
  templateCtx?: TemplateContext,
): Promise<Result<void, KMsgError>> {
  try {
    const senderKey = resolveKakaoSenderKey(ctx, templateCtx);
    const templateCode = code.trim();
    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: ctx.providerId,
        }),
      );
    }

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/template/del/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
        senderkey: senderKey,
        tpl_code: templateCode,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "template delete failed",
    });
    if (okResult.isFailure) return okResult;

    return ok(undefined);
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function listTemplates(
  ctx: AligoRuntimeContext,
  params?: { status?: string; page?: number; limit?: number },
  templateCtx?: TemplateContext,
): Promise<Result<Template[], KMsgError>> {
  try {
    const senderKey = resolveKakaoSenderKey(ctx, templateCtx);

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/template/list/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
        senderkey: senderKey,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "template list failed",
    });
    if (okResult.isFailure) return okResult;

    const listRaw = response.list;
    const list = Array.isArray(listRaw) ? listRaw : [];
    const templates = list
      .filter(isObjectRecord)
      .map((item) => {
        const tplCode = String(item.templtCode ?? "");
        const createdAt = parseAligoDateTime(item.cdate) ?? new Date();
        const updatedAt =
          parseAligoDateTime(item.udate) ??
          parseAligoDateTime(item.cdate) ??
          createdAt;

        return {
          id: tplCode,
          code: tplCode,
          name: String(item.templtName ?? ""),
          content: String(item.templtContent ?? ""),
          status: mapAligoTemplateStatus(item),
          buttons: Array.isArray(item.buttons) ? item.buttons : undefined,
          createdAt,
          updatedAt,
        } satisfies Template;
      })
      .filter((template) => template.code.length > 0);

    if (params?.status) {
      const status = params.status.trim().toUpperCase();
      return ok(templates.filter((template) => template.status === status));
    }

    return ok(templates);
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function requestTemplateInspection(
  ctx: AligoRuntimeContext,
  code: string,
  templateCtx?: TemplateContext,
): Promise<Result<void, KMsgError>> {
  try {
    const senderKey = resolveKakaoSenderKey(ctx, templateCtx);
    const templateCode = code.trim();

    if (!templateCode) {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
          providerId: ctx.providerId,
        }),
      );
    }

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/template/request/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
        senderkey: senderKey,
        tpl_code: templateCode,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "template inspection request failed",
    });
    if (okResult.isFailure) return okResult;

    return ok(undefined);
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}
