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
import { validateTemplatePayload } from "@k-msg/template/send";
import { safeParseJson, toRecordOrFallback } from "../shared/http-json";
import { isObjectRecord } from "../shared/type-guards";
import {
  getAlimTalkHeaders,
  mapIwinvCodeToKMsgErrorCode,
  mapIwinvTemplateStatus,
  normalizeIwinvCode,
  toIwinvTemplateStatus,
} from "./iwinv.alimtalk.helpers";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";
import { parseIwinvDateTime } from "./iwinv.time";

async function readIwinvTemplateResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  const responseText = await response.text();
  const parsed = safeParseJson(responseText);

  return toRecordOrFallback(parsed, {
    code: normalizeIwinvCode(parsed) ?? response.status,
    message: responseText || String(parsed || ""),
  });
}

function withProviderContext(error: KMsgError, providerId: string): KMsgError {
  return new KMsgError(error.code, error.message, {
    providerId,
    ...(error.details ?? {}),
  });
}

export async function createTemplate(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  input: TemplateCreateInput;
}): Promise<Result<Template, KMsgError>> {
  const { providerId, config, input } = params;

  if (!input || typeof input !== "object") {
    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        "Template input is required",
        {
          providerId,
        },
      ),
    );
  }
  const payloadValidation = validateTemplatePayload(input, {
    requireName: true,
    requireContent: true,
  });
  if (payloadValidation.isFailure) {
    return fail(withProviderContext(payloadValidation.error, providerId));
  }

  const url = `${config.baseUrl}/api/template/add/`;
  const payload: Record<string, unknown> = {
    templateName: payloadValidation.value.name ?? input.name,
    templateContent: payloadValidation.value.content ?? input.content,
    ...(payloadValidation.value.buttons
      ? { buttons: payloadValidation.value.buttons }
      : {}),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const data = await readIwinvTemplateResponse(response);
    const code = normalizeIwinvCode(data.code) ?? response.status;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "IWINV template create failed";

    if (!response.ok || code !== 200) {
      return fail(
        new KMsgError(mapIwinvCodeToKMsgErrorCode(code), message, {
          providerId,
          originalCode: code,
        }),
      );
    }

    const templateCodeRaw = data.templateCode;
    const templateCode =
      typeof templateCodeRaw === "string" && templateCodeRaw.trim().length > 0
        ? templateCodeRaw.trim()
        : "";

    if (!templateCode) {
      return fail(
        new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "IWINV template create did not return templateCode",
          { providerId, raw: data },
        ),
      );
    }

    const now = new Date();
    return ok({
      id: templateCode,
      code: templateCode,
      name: payloadValidation.value.name ?? input.name,
      content: payloadValidation.value.content ?? input.content,
      category: input.category,
      status: "INSPECTION",
      buttons: payloadValidation.value.buttons,
      variables: input.variables,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}

export async function updateTemplate(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  code: string;
  patch: TemplateUpdateInput;
  ctx?: TemplateContext;
}): Promise<Result<Template, KMsgError>> {
  const { providerId, config, code, patch, ctx } = params;
  const templateCode = typeof code === "string" ? code.trim() : "";
  if (!templateCode) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
        providerId,
      }),
    );
  }

  const existingResult = await getTemplate({
    providerId,
    config,
    code: templateCode,
    ctx,
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
  const payloadValidation = validateTemplatePayload(
    {
      name: nextName,
      content: nextContent,
      buttons: nextButtons,
    },
    {
      requireName: true,
      requireContent: true,
    },
  );
  if (payloadValidation.isFailure) {
    return fail(withProviderContext(payloadValidation.error, providerId));
  }

  const url = `${config.baseUrl}/api/template/modify/`;
  const payload: Record<string, unknown> = {
    templateCode,
    templateName: payloadValidation.value.name ?? nextName,
    templateContent: payloadValidation.value.content ?? nextContent,
    ...(payloadValidation.value.buttons
      ? { buttons: payloadValidation.value.buttons }
      : {}),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const data = await readIwinvTemplateResponse(response);
    const statusCode = normalizeIwinvCode(data.code) ?? response.status;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "IWINV template update failed";

    if (!response.ok || statusCode !== 200) {
      return fail(
        new KMsgError(mapIwinvCodeToKMsgErrorCode(statusCode), message, {
          providerId,
          originalCode: statusCode,
        }),
      );
    }

    const refreshed = await getTemplate({
      providerId,
      config,
      code: templateCode,
      ctx,
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
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}

export async function deleteTemplate(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  code: string;
}): Promise<Result<void, KMsgError>> {
  const { providerId, config, code } = params;
  const templateCode = typeof code === "string" ? code.trim() : "";
  if (!templateCode) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
        providerId,
      }),
    );
  }

  const url = `${config.baseUrl}/api/template/delete/`;
  const payload: Record<string, unknown> = { templateCode };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const data = await readIwinvTemplateResponse(response);
    const statusCode = normalizeIwinvCode(data.code) ?? response.status;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : typeof data.messgae === "string" && data.messgae.length > 0
          ? data.messgae
          : "IWINV template delete failed";

    if (!response.ok || statusCode !== 200) {
      return fail(
        new KMsgError(mapIwinvCodeToKMsgErrorCode(statusCode), message, {
          providerId,
          originalCode: statusCode,
        }),
      );
    }

    return ok(undefined);
  } catch (error) {
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}

export async function getTemplate(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  code: string;
  ctx?: TemplateContext;
}): Promise<Result<Template, KMsgError>> {
  const { providerId, config, code: inputCode } = params;
  const templateCode = typeof inputCode === "string" ? inputCode.trim() : "";

  if (!templateCode) {
    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, "code is required", {
        providerId,
      }),
    );
  }

  const payload: Record<string, unknown> = {
    pageNum: "1",
    pageSize: "15",
    templateCode,
  };

  const url = `${config.baseUrl}/api/template/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const data = await readIwinvTemplateResponse(response);
    const statusCode = normalizeIwinvCode(data.code) ?? response.status;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "IWINV template get failed";

    if (!response.ok || statusCode !== 200) {
      return fail(
        new KMsgError(mapIwinvCodeToKMsgErrorCode(statusCode), message, {
          providerId,
          originalCode: statusCode,
        }),
      );
    }

    const listRaw = data.list;
    const list = Array.isArray(listRaw) ? listRaw : [];
    const first = list.find(isObjectRecord);
    if (!first) {
      return fail(
        new KMsgError(KMsgErrorCode.TEMPLATE_NOT_FOUND, "Template not found", {
          providerId,
          templateCode,
        }),
      );
    }

    const templateCodeValue = first.templateCode;
    const resolvedCode =
      typeof templateCodeValue === "string"
        ? templateCodeValue
        : String(templateCodeValue ?? "");
    const name =
      typeof first.templateName === "string" ? first.templateName : "";
    const content =
      typeof first.templateContent === "string" ? first.templateContent : "";
    const status = mapIwinvTemplateStatus(first.status);
    const createdAt = parseIwinvDateTime(first.createDate) ?? new Date();

    return ok({
      id: resolvedCode,
      code: resolvedCode,
      name,
      content,
      status,
      buttons: Array.isArray(first.buttons) ? first.buttons : undefined,
      createdAt,
      updatedAt: createdAt,
    });
  } catch (error) {
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}

export async function listTemplates(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  query?: { status?: string; page?: number; limit?: number };
  ctx?: TemplateContext;
}): Promise<Result<Template[], KMsgError>> {
  const { providerId, config, query } = params;

  const pageNum =
    typeof query?.page === "number" && query.page > 0
      ? Math.floor(query.page)
      : 1;
  const pageSize =
    typeof query?.limit === "number" && query.limit > 0
      ? Math.floor(query.limit)
      : 15;

  const templateStatus = toIwinvTemplateStatus(query?.status);
  const payload: Record<string, unknown> = {
    pageNum: String(pageNum),
    pageSize: String(pageSize),
    ...(templateStatus ? { templateStatus } : {}),
  };

  const url = `${config.baseUrl}/api/template/`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: getAlimTalkHeaders(config),
      body: JSON.stringify(payload),
    });

    const data = await readIwinvTemplateResponse(response);
    const statusCode = normalizeIwinvCode(data.code) ?? response.status;
    const message =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : "IWINV template list failed";

    if (!response.ok || statusCode !== 200) {
      return fail(
        new KMsgError(mapIwinvCodeToKMsgErrorCode(statusCode), message, {
          providerId,
          originalCode: statusCode,
        }),
      );
    }

    const listRaw = data.list;
    const list = Array.isArray(listRaw) ? listRaw : [];

    const templates: Template[] = list
      .filter(isObjectRecord)
      .map((item) => {
        const templateCodeValue = item.templateCode;
        const templateCode =
          typeof templateCodeValue === "string"
            ? templateCodeValue
            : String(templateCodeValue ?? "");
        const name =
          typeof item.templateName === "string" ? item.templateName : "";
        const content =
          typeof item.templateContent === "string" ? item.templateContent : "";
        const status = mapIwinvTemplateStatus(item.status);
        const createdAt = parseIwinvDateTime(item.createDate) ?? new Date();

        return {
          id: templateCode,
          code: templateCode,
          name,
          content,
          status,
          buttons: Array.isArray(item.buttons) ? item.buttons : undefined,
          createdAt,
          updatedAt: createdAt,
        };
      })
      .filter((tpl) => tpl.code.length > 0);

    return ok(templates);
  } catch (error) {
    return fail(
      new KMsgError(
        KMsgErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : String(error),
        { providerId },
      ),
    );
  }
}
