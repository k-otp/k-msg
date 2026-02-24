import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageRepository,
  type MessageType,
  type MessageVariables,
  ok,
  type PersistenceStrategy,
  type Provider,
  type ProviderHealthStatus,
  type Result,
  type SendInput,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import type { HookContext, KMsgHooks } from "./hooks";
import type { BatchSendResult } from "./types/message.types";

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

/**
 * Routing strategy for selecting providers when multiple candidates are available.
 *
 * - `"first"`: Always select the first available provider (default)
 * - `"round_robin"`: Distribute requests across providers in rotation
 */
export type RoutingStrategy = "first" | "round_robin";

/**
 * Configuration for routing messages to specific providers.
 *
 * Controls how KMsg selects which provider to use for each message type.
 * Routing is resolved in this order: explicit `providerId` > `byType` mapping >
 * `defaultProviderId` > first provider that supports the message type.
 *
 * @example
 * ```ts
 * const routing: KMsgRoutingConfig = {
 *   defaultProviderId: 'solapi',
 *   byType: {
 *     ALIMTALK: 'iwinv',
 *     SMS: ['solapi', 'iwinv'],
 *   },
 *   strategy: 'round_robin',
 * };
 * ```
 */
export interface KMsgRoutingConfig {
  /**
   * Map of message types to provider IDs.
   * Can be a single provider ID or an array for load balancing.
   * When an array is provided, the `strategy` determines which provider is selected.
   */
  byType?: Partial<Record<MessageType, string | string[]>>;

  /**
   * Default provider ID to use when no type-specific routing is configured
   * and no explicit `providerId` is provided in the send options.
   */
  defaultProviderId?: string;

  /**
   * Strategy for selecting from multiple providers when `byType` contains an array.
   * @default "first"
   */
  strategy?: RoutingStrategy;
}

/**
 * Configuration for default values applied to outgoing messages.
 *
 * These defaults are merged with message-specific options during normalization,
 * allowing you to reduce boilerplate for commonly repeated fields.
 */
export interface KMsgDefaultsConfig {
  /**
   * SMS/LMS-specific defaults.
   */
  sms?: {
    /**
     * If type is omitted (SMS default input), upgrade to LMS when estimated bytes exceed this value.
     * @default 90
     */
    autoLmsBytes?: number;
  };

  /**
   * Kakao (ALIMTALK/FRIENDTALK) defaults.
   */
  kakao?: {
    /** Default Kakao profile ID (pfId) for template-based messages. */
    profileId?: string;
    /** Default Kakao Plus friend ID. */
    plusId?: string;
  };

  /**
   * Naver Talk (NSA) defaults.
   */
  naver?: {
    /** Default Naver Talk ID. */
    talkId?: string;
  };

  /**
   * RCS defaults.
   */
  rcs?: {
    /** Default RCS brand ID. */
    brandId?: string;
  };
}

/**
 * Configuration object for initializing a KMsg instance.
 *
 * @example
 * ```ts
 * const config: KMsgConfig = {
 *   providers: [
 *     new SolapiProvider({
 *       apiKey: process.env.SOLAPI_API_KEY!,
 *       apiSecret: process.env.SOLAPI_API_SECRET!,
 *       defaultFrom: '01000000000',
 *     }),
 *   ],
 *   routing: {
 *     defaultProviderId: 'solapi',
 *   },
 *   defaults: {
 *     sms: { autoLmsBytes: 90 },
 *   },
 * };
 * ```
 */
export interface KMsgConfig {
  /**
   * Array of provider instances to use for sending messages.
   * At least one provider is required.
   */
  providers: Provider[];

  /**
   * Optional routing configuration for provider selection.
   */
  routing?: KMsgRoutingConfig;

  /**
   * Optional defaults applied to outgoing messages.
   */
  defaults?: KMsgDefaultsConfig;

  /**
   * Optional lifecycle hooks for send operations.
   * Hooks are called at various stages: before send, on success, on error, and on completion.
   */
  hooks?: KMsgHooks;

  /**
   * Optional persistence configuration for message storage.
   * - `none`: No persistence (default)
   * - `log`: Fire-and-forget async logging
   * - `queue`: Queue for async processing
   * - `full`: Full persistence with status updates
   */
  persistence?: {
    strategy: PersistenceStrategy;
    repo: MessageRepository;
  };
}

interface ResolvedInput {
  index: number;
  normalized: SendOptions & { messageId: string };
  provider: Provider;
}

/**
 * High-level messaging facade for sending messages through configured providers.
 *
 * KMsg provides a unified API for sending various message types (SMS, LMS, MMS,
 * ALIMTALK, FRIENDTALK, RCS, etc.) through multiple providers with automatic
 * routing, template interpolation, and lifecycle hooks.
 *
 * Key features:
 * - Unified `send()` API for all message types
 * - Automatic provider routing based on message type
 * - Template variable interpolation with `#{variable}` syntax
 * - Lifecycle hooks for monitoring and tracking
 * - Batch sending with concurrency control
 * - Optional persistence strategies
 *
 * @example
 * Basic usage with a single provider:
 * ```ts
 * import { KMsg } from '@k-msg/messaging';
 * import { SolapiProvider } from '@k-msg/provider/solapi';
 *
 * const kmsg = new KMsg({
 *   providers: [
 *     new SolapiProvider({
 *       apiKey: process.env.SOLAPI_API_KEY!,
 *       apiSecret: process.env.SOLAPI_API_SECRET!,
 *       defaultFrom: '01000000000',
 *     }),
 *   ],
 * });
 *
 * // Send SMS (type is inferred when omitted)
 * const result = await kmsg.send({
 *   to: '01012345678',
 *   text: 'Hello, World!',
 * });
 *
 * if (result.isSuccess) {
 *   console.log('Message sent:', result.value.messageId);
 * }
 * ```
 *
 * @example
 * Multi-provider setup with routing:
 * ```ts
 * import { KMsg } from '@k-msg/messaging';
 * import { IWINVProvider } from '@k-msg/provider';
 * import { SolapiProvider } from '@k-msg/provider/solapi';
 *
 * const kmsg = new KMsg({
 *   providers: [
 *     new SolapiProvider({ apiKey: '...', apiSecret: '...' }),
 *     new IWINVProvider({ apiKey: '...' }),
 *   ],
 *   routing: {
 *     defaultProviderId: 'solapi',
 *     byType: {
 *       ALIMTALK: 'iwinv',
 *     },
 *   },
 * });
 *
 * // ALIMTALK will be routed to IWINV
 * await kmsg.send({
 *   type: 'ALIMTALK',
 *   to: '01012345678',
 *   templateId: 'AUTH_OTP',
 *   variables: { code: '123456' },
 * });
 * ```
 */
export class KMsg {
  private readonly providers: Provider[];
  private readonly providersById: Map<string, Provider>;
  private readonly hooks: KMsgHooks;
  private readonly routing: KMsgRoutingConfig;
  private readonly defaults: KMsgDefaultsConfig;
  private readonly rrIndexByKey: Map<string, number>;
  private readonly persistence?: {
    strategy: PersistenceStrategy;
    repo: MessageRepository;
  };

  /**
   * Creates a new KMsg instance with the specified configuration.
   *
   * @param config - Configuration object containing providers and optional settings
   * @throws Error if config is invalid or providers array is empty
   *
   * @example
   * ```ts
   * const kmsg = new KMsg({
   *   providers: [new SolapiProvider({ apiKey: '...', apiSecret: '...' })],
   *   routing: { defaultProviderId: 'solapi' },
   *   defaults: { sms: { autoLmsBytes: 90 } },
   * });
   * ```
   */
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
    this.persistence = config.persistence;
  }

  /**
   * Creates a KMsg instance with a single provider.
   *
   * This is a convenience factory method for the common case where you only
   * need one provider. It automatically sets that provider as the default.
   *
   * @param provider - The provider instance to use for all messages
   * @returns A new KMsg instance configured with the single provider
   *
   * @example
   * ```ts
   * import { KMsg } from '@k-msg/messaging';
   * import { SolapiProvider } from '@k-msg/provider/solapi';
   *
   * const kmsg = KMsg.simple(new SolapiProvider({
   *   apiKey: process.env.SOLAPI_API_KEY!,
   *   apiSecret: process.env.SOLAPI_API_SECRET!,
   *   defaultFrom: '01000000000',
   * }));
   *
   * // Ready to send messages
   * await kmsg.send({ to: '01012345678', text: 'Hello!' });
   * ```
   */
  static simple(provider: Provider): KMsg {
    return new KMsg({
      providers: [provider],
      routing: { defaultProviderId: provider.id },
    });
  }

  /**
   * Creates a KMsg instance with the specified configuration.
   *
   * This is a factory method alias for the constructor, useful for
   * functional-style code or when you prefer named factory methods.
   *
   * @param config - Configuration object containing providers and optional settings
   * @returns A new KMsg instance
   *
   * @example
   * ```ts
   * import { KMsg } from '@k-msg/messaging';
   * import { SolapiProvider } from '@k-msg/provider/solapi';
   *
   * const kmsg = KMsg.create({
   *   providers: [
   *     new SolapiProvider({
   *       apiKey: process.env.SOLAPI_API_KEY!,
   *       apiSecret: process.env.SOLAPI_API_SECRET!,
   *       defaultFrom: '01000000000',
   *     }),
   *   ],
   *   routing: { defaultProviderId: 'solapi' },
   * });
   * ```
   */
  static create(config: KMsgConfig): KMsg {
    return new KMsg(config);
  }

  /**
   * Creates a new fluent builder for constructing KMsg instances.
   *
   * The builder provides a chainable API for configuring providers,
   * routing, defaults, and hooks.
   *
   * @returns A new KMsgBuilder instance
   *
   * @example
   * ```ts
   * const kmsg = KMsg.builder()
   *   .addProvider(new SolapiProvider({ apiKey: '...', apiSecret: '...' }))
   *   .withRouting({ defaultProviderId: 'solapi' })
   *   .withDefaults({ sms: { autoLmsBytes: 90 } })
   *   .build();
   * ```
   */
  static builder(): KMsgBuilder {
    return new KMsgBuilder();
  }

  /**
   * Performs a health check on all configured providers.
   *
   * Checks the health status of each provider and aggregates the results.
   * Useful for monitoring and determining if the messaging system is operational.
   *
   * @returns A promise resolving to health check results containing:
   *   - `healthy`: `true` if all providers are healthy, `false` otherwise
   *   - `providers`: Map of provider IDs to their health status
   *   - `issues`: Array of error messages for any unhealthy providers
   *
   * @example
   * ```ts
   * const health = await kmsg.healthCheck();
   * if (!health.healthy) {
   *   console.error('Provider issues:', health.issues);
   * }
   * ```
   */
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

  /**
   * Sends a single message and returns a Result.
   *
   * This method normalizes the input, selects an appropriate provider based on
   * routing configuration, and sends the message. Template variables in the
   * message text are interpolated if `variables` are provided.
   *
   * @param input - The message to send. Can be a single `SendInput` or an array.
   *   When `type` is omitted, the message is treated as SMS and may be upgraded
   *   to LMS based on content length and `defaults.sms.autoLmsBytes`.
   * @returns A promise resolving to:
   *   - For single input: `Result<SendResult, KMsgError>`
   *   - For array input: `BatchSendResult` with individual results
   *
   * @example
   * Send an SMS:
   * ```ts
   * const result = await kmsg.send({ to: '01012345678', text: 'Hello!' });
   * if (result.isSuccess) {
   *   console.log('Sent:', result.value.messageId);
   * } else {
   *   console.error('Failed:', result.error.message);
   * }
   * ```
   *
   * @example
   * Send ALIMTALK with template variables:
   * ```ts
   * const result = await kmsg.send({
   *   type: 'ALIMTALK',
   *   to: '01012345678',
   *   templateId: 'AUTH_OTP',
   *   variables: { code: '123456', name: 'John' },
   * });
   * ```
   *
   * @example
   * Send multiple messages (batch):
   * ```ts
   * const batchResult = await kmsg.send([
   *   { to: '01011112222', text: 'Hello 1' },
   *   { to: '01033334444', text: 'Hello 2' },
   * ]);
   * console.log(`Total: ${batchResult.total}, Results: ${batchResult.results.length}`);
   * ```
   */
  async send(input: SendInput): Promise<Result<SendResult, KMsgError>>;
  async send(input: SendInput[]): Promise<BatchSendResult>;
  async send(
    input: SendInput | SendInput[],
  ): Promise<Result<SendResult, KMsgError> | BatchSendResult> {
    if (Array.isArray(input)) {
      return this.handleBatch(input);
    }

    return this.sendSingle(input);
  }

  /**
   * Sends a single message and throws on failure.
   *
   * This is a convenience method that unwraps the Result, returning the
   * `SendResult` on success or throwing the `KMsgError` on failure.
   * Useful when you want to use try/catch error handling instead of
   * checking `result.isSuccess`.
   *
   * @param input - The message to send (single message only, not an array)
   * @returns A promise resolving to `SendResult` on success
   * @throws KMsgError if the message fails to send
   *
   * @example
   * ```ts
   * try {
   *   const result = await kmsg.sendOrThrow({
   *     to: '01012345678',
   *     text: 'Hello!',
   *   });
   *   console.log('Sent:', result.messageId);
   * } catch (error) {
   *   console.error('Send failed:', error.message);
   * }
   * ```
   */
  async sendOrThrow(input: SendInput): Promise<SendResult> {
    const result = await this.sendSingle(input);
    if (result.isFailure) {
      throw result.error;
    }
    return result.value;
  }

  private async sendSingle(
    input: SendInput,
  ): Promise<Result<SendResult, KMsgError>> {
    const normalized = this.normalizeInput(input);
    const context = this.createHookContext(normalized);

    if (this.hooks.onBeforeSend) {
      await this.hooks.onBeforeSend(context);
    }

    const providerResult = this.selectProvider(normalized);
    if (providerResult.isFailure) {
      if (this.hooks.onError) {
        await this.hooks.onError(context, providerResult.error);
      }
      if (this.hooks.onFinal) {
        await this.hooks.onFinal(context, {
          outcome: "failure",
          error: providerResult.error,
        });
      }
      return fail(providerResult.error);
    }

    return this.sendWithProvider(providerResult.value, normalized, context);
  }

  private async sendWithProvider(
    provider: Provider,
    normalized: SendOptions & { messageId: string },
    context: HookContext,
  ): Promise<Result<SendResult, KMsgError>> {
    const messageId = normalized.messageId;
    const strategy = this.persistence?.strategy || "none";
    const repo = this.persistence?.repo;
    let persistedRecordId: string | undefined;
    let logPersistTriggered = false;

    const triggerLogPersistence = () => {
      if (strategy !== "log" || !repo || logPersistTriggered) {
        return;
      }
      logPersistTriggered = true;
      this.persistLogSave(repo, normalized);
    };

    try {
      const onboardingError = this.validateSendOnboarding(provider, normalized);
      if (onboardingError) {
        if (this.hooks.onError) {
          await this.hooks.onError(context, onboardingError);
        }
        return fail(onboardingError);
      }

      if (strategy === "queue" && repo) {
        const saveResult = await repo.save(normalized, { strategy });
        if (saveResult.isFailure) {
          const saveError = this.toKMsgError(saveResult.error, {
            providerId: provider.id,
          });
          if (this.hooks.onError) {
            await this.hooks.onError(context, saveError);
          }
          if (this.hooks.onFinal) {
            await this.hooks.onFinal(context, {
              outcome: "failure",
              error: saveError,
            });
          }
          return fail(saveError);
        }

        const value: SendResult = {
          messageId,
          providerId: provider.id,
          status: "PENDING",
          type: normalized.type,
          to: normalized.to,
        };

        if (this.hooks.onQueued) {
          await this.hooks.onQueued(context, value);
        }

        if (this.hooks.onFinal) {
          await this.hooks.onFinal(context, {
            outcome: "success",
            result: value,
          });
        }

        return ok(value);
      }

      if (strategy === "full" && repo) {
        const saveResult = await repo.save(normalized, { strategy });
        if (saveResult.isFailure) {
          const saveError = this.toKMsgError(saveResult.error, {
            providerId: provider.id,
          });
          if (this.hooks.onError) {
            await this.hooks.onError(context, saveError);
          }
          if (this.hooks.onFinal) {
            await this.hooks.onFinal(context, {
              outcome: "failure",
              error: saveError,
            });
          }
          return fail(saveError);
        }
        persistedRecordId = saveResult.value;
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

        if (strategy === "full" && repo && persistedRecordId) {
          const updateResult = await repo.update(persistedRecordId, value);
          if (updateResult.isFailure) {
            const updateError = this.toKMsgError(updateResult.error, {
              providerId: provider.id,
              persistedRecordId,
            });
            if (this.hooks.onError) {
              await this.hooks.onError(context, updateError);
            }
            if (this.hooks.onFinal) {
              await this.hooks.onFinal(context, {
                outcome: "failure",
                error: updateError,
              });
            }
            return fail(updateError);
          }
        } else {
          triggerLogPersistence();
        }

        if (this.hooks.onSuccess) {
          await this.hooks.onSuccess(context, value);
        }
        if (this.hooks.onFinal) {
          await this.hooks.onFinal(context, {
            outcome: "success",
            result: value,
          });
        }
        return ok(value);
      }

      const error = this.toKMsgError(result.error, {
        providerId: provider.id,
      });

      if (strategy === "full" && repo && persistedRecordId) {
        const updateResult = await repo.update(
          persistedRecordId,
          this.toFailedPersistenceOutcome(normalized, provider.id, error),
        );
        if (updateResult.isFailure) {
          const updateError = this.toKMsgError(updateResult.error, {
            providerId: provider.id,
            persistedRecordId,
          });
          if (this.hooks.onError) {
            await this.hooks.onError(context, updateError);
          }
          if (this.hooks.onFinal) {
            await this.hooks.onFinal(context, {
              outcome: "failure",
              error: updateError,
            });
          }
          return fail(updateError);
        }
      } else {
        triggerLogPersistence();
      }

      if (this.hooks.onError) {
        await this.hooks.onError(context, error);
      }
      if (this.hooks.onFinal) {
        await this.hooks.onFinal(context, {
          outcome: "failure",
          error,
        });
      }

      return fail(error);
    } catch (error) {
      const kMsgError = this.toKMsgError(error, { providerId: provider.id });

      if (strategy === "full" && repo && persistedRecordId) {
        const updateResult = await repo.update(
          persistedRecordId,
          this.toFailedPersistenceOutcome(normalized, provider.id, kMsgError),
        );
        if (updateResult.isFailure) {
          const updateError = this.toKMsgError(updateResult.error, {
            providerId: provider.id,
            persistedRecordId,
          });

          if (this.hooks.onError) {
            await this.hooks.onError(context, updateError);
          }
          if (this.hooks.onFinal) {
            await this.hooks.onFinal(context, {
              outcome: "failure",
              error: updateError,
            });
          }

          return fail(updateError);
        }
      } else {
        triggerLogPersistence();
      }

      if (this.hooks.onError) {
        await this.hooks.onError(context, kMsgError);
      }
      if (this.hooks.onFinal) {
        await this.hooks.onFinal(context, {
          outcome: "failure",
          error: kMsgError,
        });
      }

      return fail(kMsgError);
    }
  }

  private persistLogSave(repo: MessageRepository, input: SendInput): void {
    void repo.save(input, { strategy: "log" }).catch(() => undefined);
  }

  private toFailedPersistenceOutcome(
    options: SendOptions & { messageId: string },
    providerId: string | undefined,
    error: KMsgError,
  ): Partial<SendResult> {
    return {
      messageId: options.messageId,
      ...(providerId ? { providerId } : {}),
      status: "FAILED",
      type: options.type,
      to: options.to,
      raw: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  private async handleBatch(inputs: SendInput[]): Promise<BatchSendResult> {
    const resolved = this.resolveProviders(inputs);
    const groupedByProvider = this.groupInputsByProvider(resolved);
    const results: Array<Result<SendResult, KMsgError> | undefined> = new Array(
      inputs.length,
    );
    const resolvedIndexes = new Set(resolved.map((item) => item.index));

    await Promise.all(
      inputs.map(async (input, index) => {
        if (resolvedIndexes.has(index)) {
          return;
        }
        results[index] = await this.sendSingle(input);
      }),
    );

    await Promise.all(
      Array.from(groupedByProvider.entries()).map(
        async ([, providerInputs]) => {
          if (providerInputs.length === 0) {
            return;
          }

          const provider = providerInputs[0].provider;
          const chunkSize = this.resolveProviderChunkSize(provider);

          for (const chunk of this.chunkInputs(providerInputs, chunkSize)) {
            const chunkResults = await Promise.all(
              chunk.map((item) => this.sendResolved(item)),
            );

            chunkResults.forEach(({ index, result }) => {
              results[index] = result;
            });
          }
        },
      ),
    );

    return {
      total: inputs.length,
      results: results.map(
        (result, index) =>
          result ??
          fail(
            new KMsgError(
              KMsgErrorCode.UNKNOWN_ERROR,
              `Batch result missing for input index ${index}`,
            ),
          ),
      ),
    };
  }

  private async sendResolved(item: ResolvedInput): Promise<{
    index: number;
    result: Result<SendResult, KMsgError>;
  }> {
    const context = this.createHookContext(item.normalized);

    if (this.hooks.onBeforeSend) {
      await this.hooks.onBeforeSend(context);
    }

    return {
      index: item.index,
      result: await this.sendWithProvider(
        item.provider,
        item.normalized,
        context,
      ),
    };
  }

  private createHookContext(
    normalized: SendOptions & { messageId: string },
  ): HookContext {
    return {
      messageId: normalized.messageId,
      options: normalized,
      timestamp: Date.now(),
      requestId: this.resolveHookRequestId(normalized.providerOptions),
      attempt: this.resolveHookAttempt(normalized.providerOptions),
    };
  }

  private resolveHookAttempt(
    providerOptions: Record<string, unknown> | undefined,
  ): number | undefined {
    if (!providerOptions || typeof providerOptions !== "object") {
      return undefined;
    }

    const attempt = providerOptions.attempt;
    if (!Number.isFinite(attempt) || typeof attempt !== "number") {
      return undefined;
    }

    const normalized = Math.trunc(attempt);
    return normalized > 0 ? normalized : undefined;
  }

  private resolveHookRequestId(
    providerOptions: Record<string, unknown> | undefined,
  ): string | undefined {
    if (!providerOptions || typeof providerOptions !== "object") {
      return undefined;
    }

    const requestId = providerOptions.requestId;
    if (typeof requestId !== "string") {
      return undefined;
    }

    const normalized = requestId.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private toKMsgError(
    error: unknown,
    details?: Record<string, unknown>,
  ): KMsgError {
    if (error instanceof KMsgError) {
      const knownError = error;
      if (!details) return error;
      return new KMsgError(knownError.code, knownError.message, {
        ...(knownError.details || {}),
        ...details,
      });
    }

    return new KMsgError(
      KMsgErrorCode.UNKNOWN_ERROR,
      error instanceof Error ? error.message : String(error),
      details,
    );
  }

  private resolveProviderChunkSize(provider: Provider): number {
    const DEFAULT_CHUNK_SIZE = 50;
    const providerLimit = this.readProviderBatchLimit(provider);

    if (providerLimit === undefined) {
      return DEFAULT_CHUNK_SIZE;
    }

    return Math.max(1, Math.min(DEFAULT_CHUNK_SIZE, providerLimit));
  }

  private resolveProviders(inputs: SendInput[]): ResolvedInput[] {
    const resolved: ResolvedInput[] = [];

    for (const [index, input] of inputs.entries()) {
      const normalized = this.normalizeInput(input);
      const providerResult = this.selectProvider(normalized);
      if (providerResult.isFailure) {
        continue;
      }

      resolved.push({
        index,
        normalized,
        provider: providerResult.value,
      });
    }

    return resolved;
  }

  private groupInputsByProvider(
    resolved: ResolvedInput[],
  ): Map<string, ResolvedInput[]> {
    const grouped = new Map<string, ResolvedInput[]>();

    for (const item of resolved) {
      const key = item.provider.id;
      const items = grouped.get(key);
      if (items) {
        items.push(item);
        continue;
      }

      grouped.set(key, [item]);
    }

    return grouped;
  }

  private readProviderBatchLimit(provider: Provider): number | undefined {
    const runtimeProvider = provider as Provider & {
      maxBatchSize?: unknown;
      batchLimit?: unknown;
      capabilities?: {
        maxBatchSize?: unknown;
        batchLimit?: unknown;
      };
      limits?: {
        maxBatchSize?: unknown;
        send?: {
          maxBatchSize?: unknown;
          batchLimit?: unknown;
        };
        batch?: {
          max?: unknown;
          size?: unknown;
        };
      };
    };

    const candidates: unknown[] = [
      runtimeProvider.maxBatchSize,
      runtimeProvider.batchLimit,
      runtimeProvider.capabilities?.maxBatchSize,
      runtimeProvider.capabilities?.batchLimit,
      runtimeProvider.limits?.maxBatchSize,
      runtimeProvider.limits?.send?.maxBatchSize,
      runtimeProvider.limits?.send?.batchLimit,
      runtimeProvider.limits?.batch?.max,
      runtimeProvider.limits?.batch?.size,
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
        continue;
      }

      const normalized = Math.floor(candidate);
      if (normalized > 0) {
        return normalized;
      }
    }

    return undefined;
  }

  private chunkInputs<T>(inputs: T[], chunkSize: number): T[][] {
    if (inputs.length === 0) return [];

    const chunks: T[][] = [];
    for (let i = 0; i < inputs.length; i += chunkSize) {
      chunks.push(inputs.slice(i, i + chunkSize));
    }
    return chunks;
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
      if ("variables" in options && "text" in options) {
        const variables = this.coerceVariables(options.variables);
        if (variables && typeof options.text === "string") {
          return {
            ...options,
            text: this.interpolateText(options.text, variables),
          };
        }
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


/**
 * Fluent builder for creating KMsg instances.
 *
 * Provides a chainable API for configuring providers, routing, defaults, and hooks.
 * Call `build()` to create the final KMsg instance.
 *
 * @example
 * ```ts
 * const kmsg = KMsg.builder()
 *   .addProvider(new SolapiProvider({ apiKey: '...', apiSecret: '...' }))
 *   .addProvider(new IWINVProvider({ apiKey: '...' }))
 *   .withRouting({ defaultProviderId: 'solapi', byType: { ALIMTALK: 'iwinv' } })
 *   .withDefaults({ sms: { autoLmsBytes: 90 } })
 *   .withHooks({ onSuccess: (ctx, result) => console.log('Sent:', result.messageId) })
 *   .build();
 * ```
 */
export class KMsgBuilder {
  private readonly config: Partial<KMsgConfig> = {};
  private readonly providersList: Provider[] = [];

  /**
   * Adds a single provider to the builder.
   *
   * @param provider - The provider instance to add
   * @returns this builder for method chaining
   *
   * @example
   * ```ts
   * builder.addProvider(new SolapiProvider({ apiKey: '...', apiSecret: '...' }))
   * ```
   */
  addProvider(provider: Provider): this {
    this.providersList.push(provider);
    return this;
  }

  /**
   * Adds multiple providers to the builder.
   *
   * @param providers - The provider instances to add
   * @returns this builder for method chaining
   *
   * @example
   * ```ts
   * builder.addProviders(
   *   new SolapiProvider({ apiKey: '...', apiSecret: '...' }),
   *   new IWINVProvider({ apiKey: '...' })
   * )
   * ```
   */
  addProviders(...providers: Provider[]): this {
    this.providersList.push(...providers);
    return this;
  }

  /**
   * Sets the routing configuration.
   *
   * @param routing - Routing configuration for provider selection
   * @returns this builder for method chaining
   *
   * @example
   * ```ts
   * builder.withRouting({
   *   defaultProviderId: 'solapi',
   *   byType: { ALIMTALK: 'iwinv' },
   *   strategy: 'round_robin'
   * })
   * ```
   */
  withRouting(routing: KMsgRoutingConfig): this {
    this.config.routing = routing;
    return this;
  }

  /**
   * Sets the defaults configuration.
   *
   * @param defaults - Default values applied to outgoing messages
   * @returns this builder for method chaining
   *
   * @example
   * ```ts
   * builder.withDefaults({
   *   sms: { autoLmsBytes: 90 },
   *   kakao: { profileId: 'my-profile' }
   * })
   * ```
   */
  withDefaults(defaults: KMsgDefaultsConfig): this {
    this.config.defaults = defaults;
    return this;
  }

  /**
   * Sets the lifecycle hooks.
   *
   * @param hooks - Hook functions for send lifecycle events
   * @returns this builder for method chaining
   *
   * @example
   * ```ts
   * builder.withHooks({
   *   onSuccess: (ctx, result) => console.log('Sent:', result.messageId),
   *   onError: (ctx, error) => console.error('Failed:', error.message)
   * })
   * ```
   */
  withHooks(hooks: KMsgHooks): this {
    this.config.hooks = hooks;
    return this;
  }

  /**
   * Sets the persistence configuration.
   *
   * @param persistence - Persistence strategy and repository
   * @returns this builder for method chaining
   */
  withPersistence(persistence: KMsgConfig["persistence"]): this {
    this.config.persistence = persistence;
    return this;
  }

  /**
   * Builds and returns a new KMsg instance with the configured settings.
   *
   * @returns A new KMsg instance
   * @throws Error if no providers have been added
   *
   * @example
   * ```ts
   * const kmsg = KMsg.builder()
   *   .addProvider(new SolapiProvider({ apiKey: '...' }))
   *   .build();
   * ```
   */
  build(): KMsg {
    return new KMsg({
      providers: this.providersList,
      routing: this.config.routing,
      defaults: this.config.defaults,
      hooks: this.config.hooks,
      persistence: this.config.persistence,
    });
  }
}
