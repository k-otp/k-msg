import {
  fail,
  type KakaoCategoryEntry,
  type KakaoChannel,
  type KakaoChannelCategories,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Result,
} from "@k-msg/core";
import { isObjectRecord } from "../shared/type-guards";
import { mapAligoKakaoError } from "./aligo.error";
import { ensureAligoKakaoOk, requestAligo } from "./aligo.http";
import type { AligoRuntimeContext } from "./aligo.internal.types";
import { parseAligoDateTime } from "./aligo.shared.helpers";

export async function listKakaoChannels(
  ctx: AligoRuntimeContext,
  params?: {
    plusId?: string;
    senderKey?: string;
  },
): Promise<Result<KakaoChannel[], KMsgError>> {
  try {
    const body: Record<string, unknown> = {
      apikey: ctx.config.apiKey,
      userid: ctx.config.userId,
      ...(typeof params?.plusId === "string" && params.plusId.trim().length > 0
        ? { plusid: params.plusId.trim() }
        : {}),
      ...(typeof params?.senderKey === "string" &&
      params.senderKey.trim().length > 0
        ? { senderkey: params.senderKey.trim() }
        : {}),
    };

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/profile/list/",
      data: body,
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "channel list failed",
    });
    if (okResult.isFailure) return okResult;

    const listRaw = response.list;
    const list = Array.isArray(listRaw) ? listRaw : [];
    const channels: KakaoChannel[] = list
      .filter(isObjectRecord)
      .map((item) => ({
        providerId: ctx.providerId,
        senderKey: String(item.senderKey ?? ""),
        plusId: typeof item.uuid === "string" ? item.uuid : undefined,
        name: typeof item.name === "string" ? item.name : undefined,
        status: typeof item.status === "string" ? item.status : undefined,
        createdAt: parseAligoDateTime(item.cdate),
        updatedAt: parseAligoDateTime(item.udate),
        raw: item,
      }))
      .filter((channel) => channel.senderKey.length > 0);

    return ok(channels);
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function listKakaoChannelCategories(
  ctx: AligoRuntimeContext,
): Promise<Result<KakaoChannelCategories, KMsgError>> {
  try {
    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/category/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "category list failed",
    });
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
            typeof entry.parentCode === "string" && entry.parentCode.length > 0
              ? entry.parentCode
              : undefined,
        }))
        .filter((entry) => entry.code.length > 0);
    };

    return ok({
      first: mapEntries(data.firstBusinessType),
      second: mapEntries(data.secondBusinessType),
      third: mapEntries(data.thirdBusinessType),
    });
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function requestKakaoChannelAuth(
  ctx: AligoRuntimeContext,
  params: {
    plusId: string;
    phoneNumber: string;
  },
): Promise<Result<void, KMsgError>> {
  try {
    const plusId = params.plusId.trim();
    const phoneNumber = params.phoneNumber.trim();
    if (!plusId || !phoneNumber) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "plusId and phoneNumber are required",
          { providerId: ctx.providerId },
        ),
      );
    }

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/profile/auth/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
        plusid: plusId,
        phonenumber: phoneNumber,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "channel auth failed",
    });
    if (okResult.isFailure) return okResult;

    return ok(undefined);
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}

export async function addKakaoChannel(
  ctx: AligoRuntimeContext,
  params: {
    plusId: string;
    authNum: string;
    phoneNumber: string;
    categoryCode: string;
  },
): Promise<Result<KakaoChannel, KMsgError>> {
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
          { providerId: ctx.providerId },
        ),
      );
    }

    const response = await requestAligo({
      host: ctx.alimtalkHost,
      endpoint: "/akv10/profile/add/",
      data: {
        apikey: ctx.config.apiKey,
        userid: ctx.config.userId,
        plusid: plusId,
        authnum: authNum,
        phonenumber: phoneNumber,
        categorycode: categoryCode,
      },
      providerId: ctx.providerId,
    });

    const okResult = ensureAligoKakaoOk({
      providerId: ctx.providerId,
      response,
      fallbackMessage: "channel add failed",
    });
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
          {
            providerId: ctx.providerId,
            raw: response,
          },
        ),
      );
    }

    const senderKey = String(data.senderKey ?? "");
    if (!senderKey) {
      return fail(
        new KMsgError(
          KMsgErrorCode.PROVIDER_ERROR,
          "channel add did not return senderKey",
          { providerId: ctx.providerId, raw: data },
        ),
      );
    }

    return ok({
      providerId: ctx.providerId,
      senderKey,
      plusId: typeof data.uuid === "string" ? data.uuid : plusId,
      name: typeof data.name === "string" ? data.name : undefined,
      status: typeof data.status === "string" ? data.status : undefined,
      createdAt: parseAligoDateTime(data.cdate),
      updatedAt: parseAligoDateTime(data.udate),
      raw: data,
    });
  } catch (error) {
    return fail(mapAligoKakaoError(error, ctx.providerId));
  }
}
