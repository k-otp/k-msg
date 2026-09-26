import { fail, KMsgError, KMsgErrorCode, ok, type Result } from "@k-msg/core";
import { isObjectRecord } from "../shared/type-guards";
import { mapAligoKakaoError } from "./aligo.error";
import { ensureAligoKakaoOk, requestAligo } from "./aligo.http";
import type { AligoRuntimeContext } from "./aligo.internal.types";

/**
 * Aligo templates belong to a Kakao sender profile, so both name one. They are
 * trimmed, as the template APIs trim them, so a send and a later
 * updateTemplate name the same kept body.
 */
export function aligoTemplateContentKey(
  senderKey: string,
  templateCode: string,
): string {
  return `${senderKey.trim()}\n${templateCode.trim()}`;
}

/**
 * Reads one AlimTalk template's body from Aligo's template list API through
 * the send's request context, so its signal and fetch apply to the lookup as
 * well.
 */
export async function fetchAligoTemplateContent(
  ctx: AligoRuntimeContext,
  params: { senderKey: string; templateCode: string },
): Promise<Result<string, KMsgError>> {
  const { senderKey, templateCode } = params;

  try {
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
      context: ctx.requestContext,
    });

    const accepted = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "Aligo template lookup failed",
    });
    if (accepted.isFailure) return accepted;

    const list = Array.isArray(response.list) ? response.list : [];
    const template = list.find(
      (item) =>
        isObjectRecord(item) && String(item.templtCode) === templateCode,
    );
    if (
      !isObjectRecord(template) ||
      typeof template.templtContent !== "string"
    ) {
      return fail(
        new KMsgError(
          KMsgErrorCode.TEMPLATE_NOT_FOUND,
          `Aligo template ${templateCode} was not found`,
          { providerId: ctx.providerId, templateCode },
        ),
      );
    }

    return ok(template.templtContent);
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}
