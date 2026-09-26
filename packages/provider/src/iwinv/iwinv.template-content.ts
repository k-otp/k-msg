import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type ProviderRequestContext,
  type Result,
} from "@k-msg/core";
import { safeParseJson, toRecordOrFallback } from "../shared/http-json";
import {
  fetchWithProviderContext,
  toProviderTransportError,
} from "../shared/provider-transport";
import { isObjectRecord } from "../shared/type-guards";
import {
  getAlimTalkHeaders,
  mapIwinvCodeToKMsgErrorCode,
  normalizeIwinvCode,
} from "./iwinv.alimtalk.helpers";
import type { NormalizedIwinvConfig } from "./iwinv.internal.types";

const BUTTON_LINK_FIELDS = ["linkMo", "linkPc", "linkIos", "linkAnd"] as const;

/**
 * Reads the text whose placeholders one template's `templateParam` fills, its
 * content followed by its buttons' links, from IWINV's template list API
 * through the send's request context, so its signal and fetch apply to the
 * lookup as well.
 */
export async function fetchIwinvTemplateContent(params: {
  providerId: string;
  config: NormalizedIwinvConfig;
  templateCode: string;
  context?: ProviderRequestContext;
}): Promise<Result<string, KMsgError>> {
  const { providerId, config, templateCode, context } = params;
  const url = `${config.baseUrl}/api/template/`;

  try {
    const response = await fetchWithProviderContext(
      context,
      url,
      {
        method: "POST",
        headers: getAlimTalkHeaders(config),
        body: JSON.stringify({ pageNum: "1", pageSize: "15", templateCode }),
      },
      providerId,
    );

    const responseText = await response.text();
    const parsed = safeParseJson(responseText);
    const data = toRecordOrFallback(parsed, {
      code: normalizeIwinvCode(parsed) ?? response.status,
      message: responseText,
    });
    const code = normalizeIwinvCode(data.code) ?? response.status;

    if (!response.ok || code !== 200) {
      return fail(
        new KMsgError(
          mapIwinvCodeToKMsgErrorCode(code),
          typeof data.message === "string" && data.message.length > 0
            ? data.message
            : "IWINV template lookup failed",
          { providerId, originalCode: code, templateCode },
        ),
      );
    }

    const list = Array.isArray(data.list) ? data.list : [];
    const template = list.find(
      (item) =>
        isObjectRecord(item) && String(item.templateCode) === templateCode,
    );
    if (
      !isObjectRecord(template) ||
      typeof template.templateContent !== "string"
    ) {
      return fail(
        new KMsgError(
          KMsgErrorCode.TEMPLATE_NOT_FOUND,
          `IWINV template ${templateCode} was not found`,
          { providerId, templateCode },
        ),
      );
    }

    const buttons = Array.isArray(template.buttons) ? template.buttons : [];
    const links = buttons.flatMap((button) =>
      isObjectRecord(button)
        ? BUTTON_LINK_FIELDS.map((field) => button[field]).filter(
            (link): link is string => typeof link === "string",
          )
        : [],
    );
    return ok([template.templateContent, ...links].join("\n"));
  } catch (error) {
    return fail(toProviderTransportError(error, context?.signal, providerId));
  }
}
