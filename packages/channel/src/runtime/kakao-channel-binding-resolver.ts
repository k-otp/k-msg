import { KMsgError, KMsgErrorCode } from "@k-msg/core";
import type {
  KakaoChannelAliasEntry,
  KakaoChannelBindingSource,
  KakaoChannelListItem,
  KakaoChannelResolveInput,
  KakaoChannelResolverConfig,
  KakaoProviderConfigEntry,
  ResolvedKakaoChannelBinding,
} from "./types";

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeProviderType(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
}

function extractProviderBindingHint(provider: KakaoProviderConfigEntry): {
  senderKey?: string;
  plusId?: string;
} {
  const cfg =
    provider.config && typeof provider.config === "object" ? provider.config : {};

  const senderKey =
    readString((cfg as Record<string, unknown>).senderKey) ??
    readString((cfg as Record<string, unknown>).kakaoPfId) ??
    readString((cfg as Record<string, unknown>).profileId);
  const plusId = readString((cfg as Record<string, unknown>).plusId);

  const providerType = normalizeProviderType(provider.type);
  if (providerType === "solapi") {
    return {
      senderKey:
        readString((cfg as Record<string, unknown>).kakaoPfId) ?? senderKey,
      ...(plusId ? { plusId } : {}),
    };
  }

  return {
    ...(senderKey ? { senderKey } : {}),
    ...(plusId ? { plusId } : {}),
  };
}

function dedupeKey(item: KakaoChannelListItem): string {
  return [
    item.providerId ?? "",
    item.senderKey ?? "",
    item.plusId ?? "",
    item.source,
  ].join("|");
}

function selectSingleProviderId(
  providers: KakaoProviderConfigEntry[] | undefined,
): string | undefined {
  if (!Array.isArray(providers) || providers.length !== 1) return undefined;
  return readString(providers[0]?.id);
}

export class KakaoChannelBindingResolver {
  constructor(private readonly config: KakaoChannelResolverConfig) {}

  list(params?: { providerId?: string }): KakaoChannelListItem[] {
    const requestedProviderId = readString(params?.providerId);
    const aliases = this.config.aliases?.kakaoChannels ?? {};
    const items: KakaoChannelListItem[] = [];
    const seen = new Set<string>();

    const pushUnique = (item: KakaoChannelListItem): void => {
      if (requestedProviderId && item.providerId !== requestedProviderId) {
        return;
      }
      const key = dedupeKey(item);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      items.push(item);
    };

    for (const [alias, entry] of Object.entries(aliases)) {
      const providerId = readString(entry.providerId);
      if (!providerId) continue;

      const senderKey = readString(entry.senderKey);
      const plusId = readString(entry.plusId);
      if (!senderKey && !plusId) continue;

      pushUnique({
        source: "config",
        alias,
        providerId,
        ...(senderKey ? { senderKey } : {}),
        ...(plusId ? { plusId } : {}),
        ...(readString(entry.name) ? { name: readString(entry.name) } : {}),
      });
    }

    const defaultsKakao = this.config.defaults?.kakao;
    const defaultsChannelAlias = readString(defaultsKakao?.channel);
    const defaultAliasEntry = defaultsChannelAlias
      ? aliases[defaultsChannelAlias]
      : undefined;
    const defaultProviderId =
      readString(defaultAliasEntry?.providerId) ??
      readString(this.config.routing?.defaultProviderId) ??
      selectSingleProviderId(this.config.providers);

    const defaultsSenderKey =
      readString(defaultsKakao?.senderKey) ?? readString(defaultAliasEntry?.senderKey);
    const defaultsPlusId =
      readString(defaultsKakao?.plusId) ?? readString(defaultAliasEntry?.plusId);

    if (defaultProviderId && (defaultsSenderKey || defaultsPlusId)) {
      pushUnique({
        source: "config",
        ...(defaultsChannelAlias ? { alias: defaultsChannelAlias } : {}),
        providerId: defaultProviderId,
        ...(defaultsSenderKey ? { senderKey: defaultsSenderKey } : {}),
        ...(defaultsPlusId ? { plusId: defaultsPlusId } : {}),
        ...(readString(defaultAliasEntry?.name)
          ? { name: readString(defaultAliasEntry?.name) }
          : {}),
      });
    }

    for (const provider of this.config.providers ?? []) {
      const providerId = readString(provider.id);
      if (!providerId) continue;

      const hint = extractProviderBindingHint(provider);
      if (!hint.senderKey && !hint.plusId) continue;

      pushUnique({
        source: "config",
        providerId,
        ...(hint.senderKey ? { senderKey: hint.senderKey } : {}),
        ...(hint.plusId ? { plusId: hint.plusId } : {}),
      });
    }

    return items;
  }

  resolve(input?: KakaoChannelResolveInput): ResolvedKakaoChannelBinding {
    const aliases = this.config.aliases?.kakaoChannels ?? {};

    const channelAlias = readString(input?.channelAlias);
    const aliasEntry = channelAlias ? aliases[channelAlias] : undefined;

    if (channelAlias && input?.strictAlias === true && !aliasEntry) {
      throw new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `Unknown kakao channel alias: ${channelAlias}`,
      );
    }

    const defaultsKakao = this.config.defaults?.kakao;
    const defaultsChannelAlias = readString(defaultsKakao?.channel);
    const defaultAliasEntry = defaultsChannelAlias
      ? aliases[defaultsChannelAlias]
      : undefined;

    const explicitProviderId = readString(input?.providerId);
    const aliasProviderId = readString(aliasEntry?.providerId);
    const defaultsProviderId = readString(defaultAliasEntry?.providerId);
    const routingDefaultProviderId = readString(
      this.config.routing?.defaultProviderId,
    );
    const singleProviderId = selectSingleProviderId(this.config.providers);

    let providerId: string | undefined;
    let providerIdSource: KakaoChannelBindingSource = "unknown";

    if (explicitProviderId) {
      providerId = explicitProviderId;
      providerIdSource = "explicit";
    } else if (aliasProviderId) {
      providerId = aliasProviderId;
      providerIdSource = "alias";
    } else if (defaultsProviderId) {
      providerId = defaultsProviderId;
      providerIdSource = "defaults";
    } else if (routingDefaultProviderId) {
      providerId = routingDefaultProviderId;
      providerIdSource = "routing";
    } else if (singleProviderId) {
      providerId = singleProviderId;
      providerIdSource = "single_provider";
    }

    const providerEntry = providerId
      ? (this.config.providers ?? []).find((entry) => entry.id === providerId)
      : undefined;
    const providerHint = providerEntry
      ? extractProviderBindingHint(providerEntry)
      : {};

    const explicitSenderKey = readString(input?.senderKey);
    const aliasSenderKey = readString(aliasEntry?.senderKey);
    const defaultsSenderKey = readString(defaultsKakao?.senderKey);
    const defaultAliasSenderKey = readString(defaultAliasEntry?.senderKey);
    const providerHintSenderKey = readString(providerHint.senderKey);

    const explicitPlusId = readString(input?.plusId);
    const aliasPlusId = readString(aliasEntry?.plusId);
    const defaultsPlusId = readString(defaultsKakao?.plusId);
    const defaultAliasPlusId = readString(defaultAliasEntry?.plusId);
    const providerHintPlusId = readString(providerHint.plusId);

    let senderKey: string | undefined;
    let senderKeySource: KakaoChannelBindingSource | undefined;

    if (explicitSenderKey) {
      senderKey = explicitSenderKey;
      senderKeySource = "explicit";
    } else if (aliasSenderKey) {
      senderKey = aliasSenderKey;
      senderKeySource = "alias";
    } else if (defaultsSenderKey) {
      senderKey = defaultsSenderKey;
      senderKeySource = "defaults";
    } else if (defaultAliasSenderKey) {
      senderKey = defaultAliasSenderKey;
      senderKeySource = "defaults";
    } else if (providerHintSenderKey) {
      senderKey = providerHintSenderKey;
      senderKeySource = "provider_config";
    }

    let plusId: string | undefined;
    let plusIdSource: KakaoChannelBindingSource | undefined;

    if (explicitPlusId) {
      plusId = explicitPlusId;
      plusIdSource = "explicit";
    } else if (aliasPlusId) {
      plusId = aliasPlusId;
      plusIdSource = "alias";
    } else if (defaultsPlusId) {
      plusId = defaultsPlusId;
      plusIdSource = "defaults";
    } else if (defaultAliasPlusId) {
      plusId = defaultAliasPlusId;
      plusIdSource = "defaults";
    } else if (providerHintPlusId) {
      plusId = providerHintPlusId;
      plusIdSource = "provider_config";
    }

    return {
      ...(channelAlias ? { alias: channelAlias } : {}),
      ...(providerId ? { providerId } : {}),
      ...(normalizeProviderType(providerEntry?.type)
        ? { providerType: normalizeProviderType(providerEntry?.type) }
        : {}),
      ...(senderKey ? { senderKey } : {}),
      ...(plusId ? { plusId } : {}),
      ...(readString(aliasEntry?.name)
        ? { name: readString(aliasEntry?.name) }
        : readString(defaultAliasEntry?.name)
          ? { name: readString(defaultAliasEntry?.name) }
          : {}),
      providerIdSource,
      ...(senderKeySource ? { senderKeySource } : {}),
      ...(plusIdSource ? { plusIdSource } : {}),
    };
  }

  getAlias(alias: string): KakaoChannelAliasEntry | undefined {
    const normalized = readString(alias);
    if (!normalized) return undefined;
    return this.config.aliases?.kakaoChannels?.[normalized];
  }
}
