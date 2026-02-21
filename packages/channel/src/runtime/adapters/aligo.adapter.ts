import {
  fail,
  type KakaoChannel,
  type KakaoChannelCategories,
  KMsgError,
  KMsgErrorCode,
  type Result,
} from "@k-msg/core";
import type {
  KakaoChannelAddParams,
  KakaoChannelApiAdapter,
  KakaoChannelAuthParams,
  KakaoChannelListParams,
  KakaoChannelRuntimeProvider,
} from "../types";

function unsupportedOperation(
  providerId: string,
  operation: string,
): KMsgError {
  return new KMsgError(
    KMsgErrorCode.INVALID_REQUEST,
    `Provider '${providerId}' does not support kakao channel api operation '${operation}'`,
    {
      providerId,
      operation,
    },
  );
}

export class AligoChannelAdapter implements KakaoChannelApiAdapter {
  constructor(private readonly provider: KakaoChannelRuntimeProvider) {}

  async list(
    params?: KakaoChannelListParams,
  ): Promise<Result<KakaoChannel[], KMsgError>> {
    const fn = this.provider.listKakaoChannels;
    if (typeof fn !== "function") {
      return fail(unsupportedOperation(this.provider.id, "list"));
    }

    return fn.call(this.provider, params);
  }

  async categories(): Promise<Result<KakaoChannelCategories, KMsgError>> {
    const fn = this.provider.listKakaoChannelCategories;
    if (typeof fn !== "function") {
      return fail(unsupportedOperation(this.provider.id, "categories"));
    }

    return fn.call(this.provider);
  }

  async auth(params: KakaoChannelAuthParams): Promise<Result<void, KMsgError>> {
    const fn = this.provider.requestKakaoChannelAuth;
    if (typeof fn !== "function") {
      return fail(unsupportedOperation(this.provider.id, "auth"));
    }

    return fn.call(this.provider, params);
  }

  async add(
    params: KakaoChannelAddParams,
  ): Promise<Result<KakaoChannel, KMsgError>> {
    const fn = this.provider.addKakaoChannel;
    if (typeof fn !== "function") {
      return fail(unsupportedOperation(this.provider.id, "add"));
    }

    return fn.call(this.provider, params);
  }
}
