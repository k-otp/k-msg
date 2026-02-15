import { KMsg } from "k-msg";
import { loadKMsgConfig, resolveKMsgConfigEnv } from "./config/load";
import type { KMsgCliConfig } from "./config/schema";
import {
  createProviders,
  type ProviderWithCapabilities,
} from "./providers/registry";

export type Runtime = {
  configPath: string;
  config: KMsgCliConfig;
  providers: ProviderWithCapabilities[];
  providersById: Map<string, ProviderWithCapabilities>;
  kmsg: KMsg;
};

export function resolveKakaoChannelSenderKey(
  config: KMsgCliConfig,
  input?: { channelAlias?: string; senderKey?: string },
): string | undefined {
  const explicit = input?.senderKey?.trim();
  if (explicit) return explicit;

  const alias = input?.channelAlias?.trim();
  if (alias) {
    const entry = config.aliases?.kakaoChannels?.[alias];
    return entry?.senderKey;
  }

  const defaults = config.defaults?.kakao;
  if (defaults?.senderKey) return defaults.senderKey;
  if (defaults?.channel) {
    return config.aliases?.kakaoChannels?.[defaults.channel]?.senderKey;
  }
  return undefined;
}

export function loadRuntime(configPath?: string): Runtime {
  const loadedRaw = loadKMsgConfig(configPath);
  let resolved: KMsgCliConfig;
  try {
    resolved = resolveKMsgConfigEnv(loadedRaw.config);
  } catch (error) {
    throw new Error(
      `Failed to resolve env vars for config (${loadedRaw.path}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const providers = createProviders(resolved);

  const providersById = new Map<string, ProviderWithCapabilities>();
  for (const provider of providers) {
    if (providersById.has(provider.id)) {
      throw new Error(`Duplicate provider id: ${provider.id}`);
    }
    providersById.set(provider.id, provider);
  }

  const senderKey = resolveKakaoChannelSenderKey(resolved);

  const routing = resolved.routing
    ? {
        byType: resolved.routing.byType,
        defaultProviderId: resolved.routing.defaultProviderId,
        strategy: resolved.routing.strategy,
      }
    : undefined;

  const kmsg = new KMsg({
    providers,
    routing,
    defaults: {
      from: resolved.defaults?.from,
      sms: {
        autoLmsBytes: resolved.defaults?.sms?.autoLmsBytes,
      },
      ...(senderKey ? { kakao: { profileId: senderKey } } : {}),
    },
  });

  return {
    configPath: loadedRaw.path,
    config: resolved,
    providers,
    providersById,
    kmsg,
  };
}
