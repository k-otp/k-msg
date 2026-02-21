import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type KakaoChannel,
  type KakaoChannelCategories,
  type Result,
} from "@k-msg/core";
import { AligoChannelAdapter } from "./adapters/aligo.adapter";
import { IwinvChannelAdapter } from "./adapters/iwinv.adapter";
import { MockChannelAdapter } from "./adapters/mock.adapter";
import { SolapiChannelAdapter } from "./adapters/solapi.adapter";
import { KakaoChannelCapabilityService } from "./kakao-channel-capability.service";
import type {
  KakaoChannelAddParams,
  KakaoChannelApiAdapter,
  KakaoChannelApiOperation,
  KakaoChannelAuthParams,
  KakaoChannelCapability,
  KakaoChannelListItem,
  KakaoChannelListParams,
  KakaoChannelRuntimeProvider,
} from "./types";

function normalizeProviderType(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
}

function createApiAdapter(
  providerType: string | undefined,
  provider: KakaoChannelRuntimeProvider,
): KakaoChannelApiAdapter | undefined {
  switch (providerType) {
    case "aligo":
      return new AligoChannelAdapter(provider);
    case "mock":
      return new MockChannelAdapter(provider);
    default:
      return typeof provider.listKakaoChannels === "function"
        ? new AligoChannelAdapter(provider)
        : undefined;
  }
}

export class KakaoChannelLifecycleService {
  private readonly capability: KakaoChannelCapability;
  private readonly providerType?: string;
  private readonly apiAdapter?: KakaoChannelApiAdapter;
  private readonly iwinvAdapter?: IwinvChannelAdapter;
  private readonly solapiAdapter?: SolapiChannelAdapter;

  constructor(
    private readonly provider: KakaoChannelRuntimeProvider,
    capabilityService = new KakaoChannelCapabilityService(),
  ) {
    this.capability = capabilityService.resolve(provider);
    this.providerType = normalizeProviderType(this.capability.providerType);

    if (this.capability.mode === "api") {
      this.apiAdapter = createApiAdapter(this.providerType, this.provider);
    } else if (this.providerType === "iwinv") {
      this.iwinvAdapter = new IwinvChannelAdapter(this.provider);
    } else if (this.providerType === "solapi") {
      this.solapiAdapter = new SolapiChannelAdapter(this.provider);
    }
  }

  getCapability(): KakaoChannelCapability {
    return this.capability;
  }

  private unsupported(operation: KakaoChannelApiOperation): Result<never, KMsgError> {
    const message = (() => {
      if (this.capability.mode === "manual") {
        if (this.iwinvAdapter) {
          return this.iwinvAdapter.unsupportedMessage(operation);
        }
        return `Provider '${this.provider.id}' requires manual Kakao channel onboarding. Operation '${operation}' is unavailable via API.`;
      }

      if (this.capability.mode === "none") {
        if (this.solapiAdapter) {
          return this.solapiAdapter.unsupportedMessage(operation);
        }
        return `Provider '${this.provider.id}' does not support Kakao channel onboarding API operation '${operation}'.`;
      }

      return `Provider '${this.provider.id}' does not support Kakao channel onboarding API operation '${operation}'.`;
    })();

    return fail(
      new KMsgError(KMsgErrorCode.INVALID_REQUEST, message, {
        providerId: this.provider.id,
        mode: this.capability.mode,
        operation,
      }),
    );
  }

  private ensureApi(operation: KakaoChannelApiOperation): Result<void, KMsgError> {
    if (this.capability.mode !== "api") {
      return this.unsupported(operation);
    }

    if (!this.apiAdapter) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          `Provider '${this.provider.id}' is marked as api mode but does not expose kakao channel operations`,
          {
            providerId: this.provider.id,
            mode: this.capability.mode,
            operation,
          },
        ),
      );
    }

    return ok(undefined);
  }

  async list(
    params?: KakaoChannelListParams,
  ): Promise<Result<KakaoChannelListItem[], KMsgError>> {
    const ready = this.ensureApi("list");
    if (ready.isFailure) return ready;
    const apiAdapter = this.apiAdapter;
    if (!apiAdapter) return this.unsupported("list");

    const result = await apiAdapter.list(params);
    if (result.isFailure) return result;

    return ok(
      result.value.map((channel) => ({
        source: "api" as const,
        providerId: channel.providerId || this.provider.id,
        senderKey: channel.senderKey,
        ...(channel.plusId ? { plusId: channel.plusId } : {}),
        ...(channel.name ? { name: channel.name } : {}),
        ...(channel.status ? { status: channel.status } : {}),
      })),
    );
  }

  async categories(): Promise<Result<KakaoChannelCategories, KMsgError>> {
    const ready = this.ensureApi("categories");
    if (ready.isFailure) return ready;
    const apiAdapter = this.apiAdapter;
    if (!apiAdapter) return this.unsupported("categories");

    return apiAdapter.categories();
  }

  async auth(params: KakaoChannelAuthParams): Promise<Result<void, KMsgError>> {
    const ready = this.ensureApi("auth");
    if (ready.isFailure) return ready;
    const apiAdapter = this.apiAdapter;
    if (!apiAdapter) return this.unsupported("auth");

    return apiAdapter.auth(params);
  }

  async add(params: KakaoChannelAddParams): Promise<Result<KakaoChannel, KMsgError>> {
    const ready = this.ensureApi("add");
    if (ready.isFailure) return ready;
    const apiAdapter = this.apiAdapter;
    if (!apiAdapter) return this.unsupported("add");

    return apiAdapter.add(params);
  }
}
