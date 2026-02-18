import {
  type KMsgError,
  type MessageRepository,
  ok,
  type PersistenceStrategy,
  type Result,
  type SendInput,
  type SendResult,
} from "@k-msg/core";
import { KMsg } from "@k-msg/messaging";
import { loadKMsgConfig, resolveKMsgConfigEnv } from "./config/load";
import type { KMsgCliConfig } from "./config/schema";
import {
  createProviders,
  type ProviderWithCapabilities,
} from "./providers/registry";

class InMemoryMessageRepository implements MessageRepository {
  private readonly messages = new Map<string, SendResult>();
  private nextId = 1;

  async save(
    input: SendInput,
    _options?: { strategy?: PersistenceStrategy },
  ): Promise<Result<string, KMsgError>> {
    const id =
      typeof input.messageId === "string" && input.messageId.length > 0
        ? input.messageId
        : `cli-msg-${this.nextId++}`;

    this.messages.set(id, this.createPendingResult(id, input));

    return ok(id);
  }

  async update(
    messageId: string,
    result: Partial<SendResult>,
  ): Promise<Result<void, KMsgError>> {
    const current = this.messages.get(messageId);
    if (!current) return ok(undefined);

    const merged = {
      ...current,
      ...result,
      messageId,
    };

    this.messages.set(messageId, {
      ...merged,
      providerId: merged.providerId ?? current.providerId,
      status: merged.status ?? current.status,
      type: merged.type ?? current.type,
      to: merged.to ?? current.to,
    });

    return ok(undefined);
  }

  async find(messageId: string): Promise<Result<SendResult | null, KMsgError>> {
    return ok(this.messages.get(messageId) ?? null);
  }

  private createPendingResult(messageId: string, input: SendInput): SendResult {
    const type: SendResult["type"] =
      "type" in input && input.type ? input.type : "SMS";

    return {
      messageId,
      providerId: input.providerId ?? "unknown",
      status: "PENDING",
      type,
      to: input.to,
    };
  }
}

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

export function resolveKakaoChannelPlusId(
  config: KMsgCliConfig,
  input?: { channelAlias?: string; plusId?: string },
): string | undefined {
  const explicit = input?.plusId?.trim();
  if (explicit) return explicit;

  const alias = input?.channelAlias?.trim();
  if (alias) {
    const entry = config.aliases?.kakaoChannels?.[alias];
    if (entry?.plusId) return entry.plusId;
  }

  const defaults = config.defaults?.kakao;
  if (defaults?.plusId) return defaults.plusId;
  if (defaults?.channel) {
    return config.aliases?.kakaoChannels?.[defaults.channel]?.plusId;
  }
  return undefined;
}

export async function loadRuntime(configPath?: string): Promise<Runtime> {
  const loadedRaw = await loadKMsgConfig(configPath);
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

  const providers = await createProviders(resolved);

  const providersById = new Map<string, ProviderWithCapabilities>();
  for (const provider of providers) {
    if (providersById.has(provider.id)) {
      throw new Error(`Duplicate provider id: ${provider.id}`);
    }
    providersById.set(provider.id, provider);
  }

  const senderKey = resolveKakaoChannelSenderKey(resolved);
  const plusId = resolveKakaoChannelPlusId(resolved);

  const routing = resolved.routing
    ? {
        byType: resolved.routing.byType,
        defaultProviderId: resolved.routing.defaultProviderId,
        strategy: resolved.routing.strategy,
      }
    : undefined;

  const persistence = resolved.persistence
    ? {
        strategy: resolved.persistence.strategy ?? "none",
        repo: new InMemoryMessageRepository(),
      }
    : undefined;

  const kmsg = new KMsg({
    providers,
    routing,
    ...(persistence ? { persistence } : {}),
    defaults: {
      sms: {
        autoLmsBytes: resolved.defaults?.sms?.autoLmsBytes,
      },
      ...(senderKey || plusId
        ? {
            kakao: {
              ...(senderKey ? { profileId: senderKey } : {}),
              ...(plusId ? { plusId } : {}),
            },
          }
        : {}),
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
