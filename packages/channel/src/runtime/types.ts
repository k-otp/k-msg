import type {
  KakaoChannel,
  KakaoChannelCategories,
  KMsgError,
  ProviderOnboardingSpec,
  Result,
} from "@k-msg/core";

export type KakaoChannelCapabilityMode = "api" | "manual" | "none";

export type KakaoChannelBindingSource =
  | "explicit"
  | "alias"
  | "defaults"
  | "provider_config"
  | "routing"
  | "single_provider"
  | "unknown";

export type KakaoChannelApiOperation = "list" | "categories" | "auth" | "add";

export interface KakaoChannelBinding {
  alias?: string;
  providerId?: string;
  senderKey?: string;
  plusId?: string;
  name?: string;
}

export interface ResolvedKakaoChannelBinding extends KakaoChannelBinding {
  providerType?: string;
  providerIdSource: KakaoChannelBindingSource;
  senderKeySource?: KakaoChannelBindingSource;
  plusIdSource?: KakaoChannelBindingSource;
}

export interface KakaoChannelListItem extends KakaoChannelBinding {
  source: "api" | "config";
  status?: string;
}

export interface KakaoChannelListParams {
  plusId?: string;
  senderKey?: string;
}

export interface KakaoChannelAuthParams {
  plusId: string;
  phoneNumber: string;
}

export interface KakaoChannelAddParams {
  plusId: string;
  authNum: string;
  phoneNumber: string;
  categoryCode: string;
}

export interface KakaoChannelRuntimeProvider {
  id: string;
  getOnboardingSpec?: () => ProviderOnboardingSpec;
  listKakaoChannels?: (
    params?: KakaoChannelListParams,
  ) => Promise<Result<KakaoChannel[], KMsgError>>;
  listKakaoChannelCategories?: () => Promise<
    Result<KakaoChannelCategories, KMsgError>
  >;
  requestKakaoChannelAuth?: (
    params: KakaoChannelAuthParams,
  ) => Promise<Result<void, KMsgError>>;
  addKakaoChannel?: (
    params: KakaoChannelAddParams,
  ) => Promise<Result<KakaoChannel, KMsgError>>;
}

export interface KakaoChannelApiAdapter {
  list(
    params?: KakaoChannelListParams,
  ): Promise<Result<KakaoChannel[], KMsgError>>;
  categories(): Promise<Result<KakaoChannelCategories, KMsgError>>;
  auth(params: KakaoChannelAuthParams): Promise<Result<void, KMsgError>>;
  add(params: KakaoChannelAddParams): Promise<Result<KakaoChannel, KMsgError>>;
}

export interface KakaoChannelCapability {
  providerId: string;
  providerType?: string;
  mode: KakaoChannelCapabilityMode;
  supports: {
    list: boolean;
    categories: boolean;
    auth: boolean;
    add: boolean;
  };
}

export interface KakaoChannelAliasEntry {
  providerId: string;
  senderKey?: string;
  plusId?: string;
  name?: string;
  [key: string]: unknown;
}

export interface KakaoProviderConfigEntry {
  id: string;
  type?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface KakaoChannelResolverConfig {
  routing?: {
    defaultProviderId?: string;
    [key: string]: unknown;
  };
  defaults?: {
    kakao?: {
      channel?: string;
      senderKey?: string;
      plusId?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  aliases?: {
    kakaoChannels?: Record<string, KakaoChannelAliasEntry>;
    [key: string]: unknown;
  };
  providers?: KakaoProviderConfigEntry[];
  [key: string]: unknown;
}

export interface KakaoChannelResolveInput {
  providerId?: string;
  channelAlias?: string;
  senderKey?: string;
  plusId?: string;
  strictAlias?: boolean;
}
