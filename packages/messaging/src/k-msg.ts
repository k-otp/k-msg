import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  type MessageVariables,
  ok,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendInput,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import type { HookContext, KMsgHooks } from "./hooks";

function interpolateTemplate(
  text: string,
  vars: Record<string, string>,
): string {
  if (!text) return "";
  return text.replace(/#\{([^}]+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export type RoutingStrategy = "first" | "round_robin";

export interface KMsgRoutingConfig {
  byType?: Partial<Record<MessageType, string | string[]>>;
  defaultProviderId?: string;
  strategy?: RoutingStrategy;
}

export interface KMsgDefaultsConfig {
  sms?: {
    /**
     * If type is omitted (SMS default input), upgrade to LMS when estimated bytes exceed this value.
     * Default: 90
     */
    autoLmsBytes?: number;
  };
  kakao?: {
    profileId?: string;
    plusId?: string;
  };
  naver?: {
    talkId?: string;
  };
  rcs?: {
    brandId?: string;
  };
}

export interface KMsgConfig {
  providers: Provider[];
  routing?: KMsgRoutingConfig;
  defaults?: KMsgDefaultsConfig;
  hooks?: KMsgHooks;
}

export class KMsg {
  private readonly providers: Provider[];
  private readonly providersById: Map<string, Provider>;
  private readonly hooks: KMsgHooks;
  private readonly routing: KMsgRoutingConfig;
  private readonly defaults: KMsgDefaultsConfig;
  private readonly rrIndexByKey: Map<string, number>;

  constructor(config: KMsgConfig) {
    if (!config || typeof config !== "object") {
      throw new Error("KMsg requires a config object");
    }
    if (!Array.isArray(config.providers) || config.providers.length === 0) {
      throw new Error("KMsg requires non-empty `providers`");
    }

    this.providers = config.providers;
    this.providersById = new Map();
    for (const provider of this.providers) {
      if (!provider || typeof provider.id !== "string") {
        throw new Error("Invalid provider instance in `providers`");
      }
      if (this.providersById.has(provider.id)) {
        throw new Error(`Duplicate provider id: ${provider.id}`);
      }
      this.providersById.set(provider.id, provider);
    }

    this.hooks = config.hooks || {};
    this.routing = config.routing || {};
    this.defaults = config.defaults || {};
    this.rrIndexByKey = new Map();
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    providers: Record<string, ProviderHealthStatus>;
    issues: string[];
  }> {
    const results = await Promise.allSettled(
      this.providers.map(async (provider) => ({
        providerId: provider.id,
        health: await provider.healthCheck(),
      })),
    );

    const providers: Record<string, ProviderHealthStatus> = {};
    const issues: string[] = [];

    for (const entry of results) {
      if (entry.status === "rejected") {
        issues.push(String(entry.reason));
        continue;
      }
      providers[entry.value.providerId] = entry.value.health;
      if (!entry.value.health.healthy) {
        issues.push(
          `${entry.value.providerId}: ${entry.value.health.issues.join(", ")}`,
        );
      }
    }

    return {
      healthy: issues.length === 0,
      providers,
      issues,
    };
  }

  async send(input: SendInput): Promise<Result<SendResult, KMsgError>> {
    const normalized = this.normalizeInput(input);
    const messageId = normalized.messageId;
    const context: HookContext = {
      messageId,
      options: normalized,
      timestamp: Date.now(),
    };

    try {
      if (this.hooks.onBeforeSend) {
        await this.hooks.onBeforeSend(context);
      }

      const providerResult = this.selectProvider(normalized);
      if (providerResult.isFailure) {
        if (this.hooks.onError) {
          await this.hooks.onError(context, providerResult.error);
        }
        return fail(providerResult.error);
      }

      const provider = providerResult.value;
      const onboardingError = this.validateSendOnboarding(provider, normalized);
      if (onboardingError) {
        if (this.hooks.onError) {
          await this.hooks.onError(context, onboardingError);
        }
        return fail(onboardingError);
      }
      const result = await provider.send(normalized);

      if (result.isSuccess) {
        const value: SendResult = {
          ...result.value,
          messageId,
          providerId: provider.id,
          type: normalized.type,
          to: normalized.to,
        };
        if (this.hooks.onSuccess) {
          await this.hooks.onSuccess(context, value);
        }
        return ok(value);
      }

      const error = this.toKMsgError(result.error, {
        providerId: provider.id,
      });

      if (this.hooks.onError) {
        await this.hooks.onError(context, error);
      }

      return fail(error);
    } catch (error) {
      const kMsgError = this.toKMsgError(error);

      if (this.hooks.onError) {
        await this.hooks.onError(context, kMsgError);
      }

      return fail(kMsgError);
    }
  }

  async sendOrThrow(input: SendInput): Promise<SendResult> {
    const result = await this.send(input);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  async sendMany(
    inputs: SendInput[],
    options?: { concurrency?: number; stopOnFailure?: boolean },
  ): Promise<Array<Result<SendResult, KMsgError>>> {
    if (!Array.isArray(inputs)) {
      throw new Error("sendMany requires an array");
    }

    const concurrency =
      typeof options?.concurrency === "number" && options.concurrency > 0
        ? Math.floor(options.concurrency)
        : 10;
    const stopOnFailure = options?.stopOnFailure === true;

    const results: Array<Result<SendResult, KMsgError>> = new Array(
      inputs.length,
    );

    let idx = 0;
    let aborted = false;

    const worker = async () => {
      while (true) {
        if (aborted) return;
        const current = idx++;
        if (current >= inputs.length) return;

        const currentInput = inputs[current];
        if (!currentInput) return;

        const result = await this.send(currentInput);
        results[current] = result;

        if (stopOnFailure && result.isFailure) {
          aborted = true;
          return;
        }
      }
    };

    const workers = new Array(Math.min(concurrency, inputs.length))
      .fill(null)
      .map(() => worker());
    await Promise.all(workers);

    // Fill any remaining slots when aborted early.
    for (let i = 0; i < results.length; i += 1) {
      if (results[i] === undefined) {
        results[i] = fail(
          new KMsgError(
            KMsgErrorCode.MESSAGE_SEND_FAILED,
            "Aborted by stopOnFailure",
          ),
        );
      }
    }

    return results;
  }

  private toKMsgError(
    error: unknown,
    details?: Record<string, unknown>,
  ): KMsgError {
    if (error instanceof KMsgError) {
      if (!details) return error;
      return new KMsgError(error.code, error.message, {
        ...(error.details || {}),
        ...details,
      });
    }

    return new KMsgError(
      KMsgErrorCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : String(error),
      details,
    );
  }

  private selectProvider(options: SendOptions): Result<Provider, KMsgError> {
    const requestedProviderId = options.providerId;
    if (requestedProviderId) {
      const provider = this.providersById.get(requestedProviderId);
      if (!provider) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `Provider not found: ${requestedProviderId}`,
          ),
        );
      }
      if (!provider.supportedTypes.includes(options.type)) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `Provider ${requestedProviderId} does not support type ${options.type}`,
          ),
        );
      }
      return ok(provider);
    }

    const byType = this.routing.byType?.[options.type];
    const resolvedProviderId = Array.isArray(byType)
      ? this.pickRoundRobin(
          `type:${options.type}`,
          byType,
          this.routing.strategy || "first",
        )
      : byType;

    if (typeof resolvedProviderId === "string" && resolvedProviderId.length) {
      const provider = this.providersById.get(resolvedProviderId);
      if (!provider) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `Provider not found: ${resolvedProviderId}`,
          ),
        );
      }
      if (!provider.supportedTypes.includes(options.type)) {
        return fail(
          new KMsgError(
            KMsgErrorCode.INVALID_REQUEST,
            `Provider ${resolvedProviderId} does not support type ${options.type}`,
          ),
        );
      }
      return ok(provider);
    }

    const fallbackProviderId = this.routing.defaultProviderId;
    if (fallbackProviderId) {
      const provider = this.providersById.get(fallbackProviderId);
      if (provider?.supportedTypes.includes(options.type)) {
        return ok(provider);
      }
    }

    const supported = this.providers.find((provider) =>
      provider.supportedTypes.includes(options.type),
    );
    if (supported) return ok(supported);

    return fail(
      new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `No provider available for type ${options.type}`,
      ),
    );
  }

  private pickRoundRobin(
    key: string,
    candidates: string[],
    strategy: RoutingStrategy,
  ): string | undefined {
    const filtered = candidates.filter((id) => this.providersById.has(id));
    if (filtered.length === 0) return undefined;

    if (strategy === "round_robin") {
      const current = this.rrIndexByKey.get(key) ?? 0;
      const next = filtered[current % filtered.length];
      if (!next) return filtered[0];
      this.rrIndexByKey.set(key, (current + 1) % filtered.length);
      return next;
    }

    return filtered[0];
  }

  private normalizeInput(
    input: SendInput,
  ): SendOptions & { messageId: string } {
    const explicitType =
      typeof (input as unknown as Record<string, unknown>).type === "string";

    if (!explicitType) {
      // SMS default input path (type omitted)
      const record = input as unknown as Record<string, unknown>;
      const to = typeof record.to === "string" ? record.to : "";
      const from = typeof record.from === "string" ? record.from : undefined;
      const textRaw =
        typeof record.text === "string"
          ? record.text
          : typeof record.content === "string"
            ? record.content
            : "";
      const subject = typeof record.subject === "string" ? record.subject : "";
      const variables = this.coerceVariables(record.variables);
      const providerId =
        typeof record.providerId === "string" ? record.providerId : undefined;

      const messageId =
        typeof record.messageId === "string" && record.messageId.length > 0
          ? record.messageId
          : crypto.randomUUID();

      const threshold =
        typeof this.defaults.sms?.autoLmsBytes === "number" &&
        this.defaults.sms.autoLmsBytes > 0
          ? this.defaults.sms.autoLmsBytes
          : 90;
      const estimated = this.estimateBytes(textRaw);
      const type: "SMS" | "LMS" = estimated > threshold ? "LMS" : "SMS";

      const normalized: SendOptions = {
        type,
        to,
        from,
        text: this.interpolateText(textRaw, variables),
        ...(subject ? { subject } : {}),
        ...(variables ? { variables } : {}),
        ...(providerId ? { providerId } : {}),
        messageId,
      };
      return normalized as SendOptions & { messageId: string };
    }

    // Typed options path (SendOptions)
    const options = input as SendOptions;
    const messageId = options.messageId || crypto.randomUUID();

    const withMessageId = { ...options, messageId } as SendOptions;

    // Apply defaults (profileId/talkId/brandId)
    const patched = this.applyDefaults(withMessageId);

    // Interpolate for text-based types when variables exist.
    const interpolated = this.interpolateTextOptions(patched);
    return { ...interpolated, messageId } as SendOptions & {
      messageId: string;
    };
  }

  private applyDefaults(options: SendOptions): SendOptions {
    const base = options;

    if (base.type === "ALIMTALK" || base.type === "FRIENDTALK") {
      const profileId =
        typeof base.kakao?.profileId === "string" &&
        base.kakao.profileId.length > 0
          ? base.kakao.profileId
          : typeof this.defaults.kakao?.profileId === "string"
            ? this.defaults.kakao.profileId
            : undefined;
      const plusId =
        typeof base.kakao?.plusId === "string" && base.kakao.plusId.length > 0
          ? base.kakao.plusId
          : typeof this.defaults.kakao?.plusId === "string" &&
              this.defaults.kakao.plusId.length > 0
            ? this.defaults.kakao.plusId
            : undefined;
      if (profileId || plusId) {
        return {
          ...base,
          kakao: {
            ...(base.kakao || {}),
            ...(profileId ? { profileId } : {}),
            ...(plusId ? { plusId } : {}),
          },
        };
      }
    }

    if (base.type === "NSA") {
      const talkId =
        typeof base.naver?.talkId === "string" && base.naver.talkId.length > 0
          ? base.naver.talkId
          : typeof this.defaults.naver?.talkId === "string"
            ? this.defaults.naver.talkId
            : undefined;
      if (talkId) {
        return {
          ...base,
          naver: { ...(base.naver || {}), talkId },
        };
      }
    }

    if (
      base.type === "RCS_SMS" ||
      base.type === "RCS_LMS" ||
      base.type === "RCS_MMS" ||
      base.type === "RCS_TPL" ||
      base.type === "RCS_ITPL" ||
      base.type === "RCS_LTPL"
    ) {
      const brandId =
        typeof base.rcs?.brandId === "string" && base.rcs.brandId.length > 0
          ? base.rcs.brandId
          : typeof this.defaults.rcs?.brandId === "string"
            ? this.defaults.rcs.brandId
            : undefined;
      if (brandId) {
        return {
          ...base,
          rcs: { ...(base.rcs || {}), brandId },
        };
      }
    }

    return base;
  }

  private coerceVariables(value: unknown): MessageVariables | undefined {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }
    return value as MessageVariables;
  }

  private interpolateText(text: string, variables?: MessageVariables): string {
    if (!variables) return text;
    if (!text || text.trim().length === 0) return text;
    return interpolateTemplate(text, this.stringifyVariables(variables));
  }

  private interpolateTextOptions(options: SendOptions): SendOptions {
    if (
      options.type === "SMS" ||
      options.type === "LMS" ||
      options.type === "MMS" ||
      options.type === "FRIENDTALK" ||
      options.type === "VOICE" ||
      options.type === "RCS_SMS" ||
      options.type === "RCS_LMS" ||
      options.type === "RCS_MMS"
    ) {
      const variables = this.coerceVariables((options as any).variables);
      if (variables && typeof (options as any).text === "string") {
        return {
          ...(options as any),
          text: this.interpolateText((options as any).text, variables),
        } as SendOptions;
      }
    }
    return options;
  }

  private stringifyVariables(
    variables: MessageVariables,
  ): Record<string, string> {
    const output: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined) continue;
      output[key] =
        value === null
          ? ""
          : value instanceof Date
            ? value.toISOString()
            : typeof value === "string"
              ? value
              : String(value);
    }
    return output;
  }

  private estimateBytes(text: string): number {
    let bytes = 0;
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      bytes += code <= 0x7f ? 1 : 2;
    }
    return bytes;
  }

  private validateSendOnboarding(
    provider: Provider,
    options: SendOptions,
  ): KMsgError | undefined {
    if (options.type !== "ALIMTALK") return undefined;
    if (typeof provider.getOnboardingSpec !== "function") return undefined;

    const spec = provider.getOnboardingSpec();
    if (!spec) return undefined;

    if (spec.plusIdPolicy === "optional") return undefined;

    const plusId = this.resolveKakaoPlusId(options);
    if (plusId) return undefined;

    if (spec.plusIdPolicy === "required") {
      return new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `kakao plusId is required for provider '${provider.id}'`,
        {
          providerId: provider.id,
          policy: spec.plusIdPolicy,
        },
      );
    }

    if (
      spec.plusIdPolicy === "required_if_no_inference" &&
      spec.plusIdInference === "unsupported"
    ) {
      return new KMsgError(
        KMsgErrorCode.INVALID_REQUEST,
        `kakao plusId is required for provider '${provider.id}' when plusId inference is unavailable`,
        {
          providerId: provider.id,
          policy: spec.plusIdPolicy,
          plusIdInference: spec.plusIdInference,
        },
      );
    }

    return undefined;
  }

  private resolveKakaoPlusId(options: SendOptions): string | undefined {
    if (options.type !== "ALIMTALK" && options.type !== "FRIENDTALK") {
      return undefined;
    }
    const plusId =
      typeof options.kakao?.plusId === "string" ? options.kakao.plusId : "";
    const trimmed = plusId.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
}
