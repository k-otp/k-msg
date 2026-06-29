import type {
  AlimTalkFailoverOptions,
  MessageType,
  MessageVariables,
} from "@k-msg/core";
import { providerCliMetadata } from "@k-msg/provider";
import { z } from "zod";
import type { CliTerminal, PromptApi } from "../cli/command-contract";
import { promptSelect, promptText } from "../cli/prompt";
import { CapabilityNotSupportedError, parseJson } from "../cli/utils";
import type { KMsgCliConfig } from "../config/schema";
import type { ProviderWithCapabilities } from "../providers/registry";
import {
  type Runtime,
  resolveKakaoChannelPlusId,
  resolveKakaoChannelSenderKey,
} from "../runtime";

const INTERACTIVE_PROVIDER_MANUAL = "__manual__";
const smsProviderTypes: readonly MessageType[] = ["SMS", "LMS", "MMS"];

const messageVariablesSchema = z.record(z.string(), z.unknown());

export interface InteractiveSmsDraft {
  from?: string;
  provider?: string;
  scheduledAt?: Date;
  text?: string;
  to?: string;
  type?: "SMS" | "LMS" | "MMS";
}

export interface InteractiveAlimTalkDraft {
  channel?: string;
  failover?: AlimTalkFailoverOptions;
  from?: string;
  plusId?: string;
  provider?: string;
  scheduledAt?: Date;
  senderKey?: string;
  templateId?: string;
  to?: string;
  vars?: MessageVariables;
}

export interface InteractiveSmsInput {
  from?: string;
  options?: {
    scheduledAt: Date;
  };
  providerId: string;
  text: string;
  to: string;
  type?: "SMS" | "LMS" | "MMS";
}

export interface InteractiveAlimTalkInput {
  failover?: AlimTalkFailoverOptions;
  from?: string;
  kakao?: {
    plusId?: string;
    profileId?: string;
  };
  options?: {
    scheduledAt: Date;
  };
  providerId: string;
  templateId: string;
  to: string;
  variables: MessageVariables;
}

type KakaoAliasOption = {
  alias: string;
  hint?: string;
  label: string;
};

type KakaoAliasSelection =
  | { mode: "alias"; alias: string }
  | { mode: "manual" }
  | { mode: "skip" };

export function ensureInteractiveSendAllowed(input: {
  commandPath: string;
  interactive: boolean;
  json: boolean | undefined;
  terminal: CliTerminal;
}): void {
  if (!input.interactive) return;
  if (!input.terminal.isInteractive) {
    throw new Error(
      `${input.commandPath} --interactive requires an interactive terminal`,
    );
  }
  if (input.json === true) {
    throw new Error(
      `${input.commandPath} --interactive cannot be combined with --json true`,
    );
  }
}

export function pickSmsProvider(
  runtime: Runtime,
  requestedProviderId?: string,
): ProviderWithCapabilities {
  return pickProviderForTypes(runtime, smsProviderTypes, requestedProviderId);
}

export function pickAlimTalkProvider(
  runtime: Runtime,
  requestedProviderId?: string,
): ProviderWithCapabilities {
  return pickProviderForTypes(runtime, ["ALIMTALK"], requestedProviderId);
}

export async function buildInteractiveSmsInput(input: {
  draft: InteractiveSmsDraft;
  prompt: PromptApi;
  runtime: Runtime;
}): Promise<InteractiveSmsInput> {
  const { draft, prompt, runtime } = input;

  const to =
    normalizeRequiredText(draft.to) ??
    (
      await promptText(prompt, {
        message: "Recipient phone number",
        validate: (value) =>
          value.trim().length > 0 ? true : "Recipient phone number is required",
      })
    ).trim();

  const text =
    preserveRequiredText(draft.text) ??
    (await promptText(prompt, {
      message: "Message text",
      validate: (value) =>
        value.trim().length > 0 ? true : "Message text is required",
    }));

  const resolvedType = resolveInteractiveSmsType(
    runtime.config,
    text,
    draft.type,
  );
  const provider = draft.provider
    ? pickProviderForTypes(runtime, [resolvedType], draft.provider)
    : await promptProviderSelection({
        defaultProviderId: getDefaultProviderId(runtime, [resolvedType]),
        message: `Select ${resolvedType} provider`,
        prompt,
        providers: getProvidersForTypes(runtime, [resolvedType]),
      });

  const from =
    normalizeOptionalText(draft.from) ??
    normalizeOptionalText(
      await promptText(prompt, {
        message: buildSenderPromptMessage(
          provider.id,
          resolveSmsDefaultFrom(runtime.config, provider.id),
        ),
      }),
    );

  const scheduledAt =
    draft.scheduledAt ??
    (await promptOptionalDate(prompt, "Schedule time (ISO, optional)"));

  return {
    providerId: provider.id,
    to,
    text,
    type: resolvedType,
    ...(from ? { from } : {}),
    ...(scheduledAt ? { options: { scheduledAt } } : {}),
  };
}

export async function buildInteractiveAlimTalkInput(input: {
  draft: InteractiveAlimTalkDraft;
  prompt: PromptApi;
  runtime: Runtime;
}): Promise<InteractiveAlimTalkInput> {
  const { draft, prompt, runtime } = input;
  const provider = draft.provider
    ? pickAlimTalkProvider(runtime, draft.provider)
    : await promptProviderSelection({
        defaultProviderId: getDefaultProviderId(runtime, ["ALIMTALK"]),
        message: "Select ALIMTALK provider",
        prompt,
        providers: getProvidersForTypes(runtime, ["ALIMTALK"]),
      });

  const to =
    normalizeRequiredText(draft.to) ??
    (
      await promptText(prompt, {
        message: "Recipient phone number",
        validate: (value) =>
          value.trim().length > 0 ? true : "Recipient phone number is required",
      })
    ).trim();

  const templateId =
    normalizeRequiredText(draft.templateId) ??
    (
      await promptText(prompt, {
        message: "Template ID",
        validate: (value) =>
          value.trim().length > 0 ? true : "Template ID is required",
      })
    ).trim();

  const variables =
    draft.vars ??
    (await promptMessageVariables(prompt, "Template variables JSON"));

  const from =
    normalizeOptionalText(draft.from) ??
    normalizeOptionalText(
      await promptText(prompt, {
        message: buildSenderPromptMessage(
          provider.id,
          resolveSmsDefaultFrom(runtime.config, provider.id),
        ),
      }),
    );

  const scheduledAt =
    draft.scheduledAt ??
    (await promptOptionalDate(prompt, "Schedule time (ISO, optional)"));

  const explicitChannel = normalizeOptionalText(draft.channel);
  const channelSelection = explicitChannel
    ? ({ mode: "alias", alias: explicitChannel } as const)
    : await promptKakaoAlias({
        config: runtime.config,
        prompt,
        providerId: provider.id,
        skipPrompt:
          normalizeOptionalText(draft.senderKey) !== undefined ||
          normalizeOptionalText(draft.plusId) !== undefined,
      });
  const channel =
    channelSelection.mode === "alias" ? channelSelection.alias : undefined;
  const manualKakaoSelection = channelSelection.mode === "manual";

  let senderKey = manualKakaoSelection
    ? normalizeOptionalText(draft.senderKey)
    : resolveKakaoChannelSenderKey(runtime.config, {
        providerId: provider.id,
        channelAlias: channel,
        senderKey: draft.senderKey,
        plusId: draft.plusId,
      });
  let plusId = manualKakaoSelection
    ? normalizeOptionalText(draft.plusId)
    : resolveKakaoChannelPlusId(runtime.config, {
        providerId: provider.id,
        channelAlias: channel,
        senderKey: draft.senderKey,
        plusId: draft.plusId,
      });

  if (!senderKey) {
    senderKey = normalizeOptionalText(
      await promptText(prompt, {
        message: buildSenderKeyPromptMessage(provider.id),
      }),
    );
  }

  if (!plusId && !manualKakaoSelection) {
    plusId = resolveKakaoChannelPlusId(runtime.config, {
      providerId: provider.id,
      channelAlias: channel,
      senderKey,
      plusId: draft.plusId,
    });
  }

  const spec =
    typeof provider.getOnboardingSpec === "function"
      ? provider.getOnboardingSpec()
      : undefined;
  if (!plusId && shouldPromptForPlusId(spec)) {
    plusId = normalizeOptionalText(
      await promptText(prompt, {
        message: buildPlusIdPromptMessage(provider.id, spec?.plusIdInference),
      }),
    );
  }

  return {
    providerId: provider.id,
    to,
    templateId,
    variables,
    ...(draft.failover ? { failover: draft.failover } : {}),
    ...(from ? { from } : {}),
    ...(scheduledAt ? { options: { scheduledAt } } : {}),
    ...(senderKey || plusId
      ? {
          kakao: {
            ...(senderKey ? { profileId: senderKey } : {}),
            ...(plusId ? { plusId } : {}),
          },
        }
      : {}),
  };
}

function buildSenderPromptMessage(
  providerId: string,
  defaultFrom: string | undefined,
): string {
  return defaultFrom
    ? `Sender number (optional, ${providerId}.config fallback: ${defaultFrom})`
    : "Sender number (optional)";
}

function buildSenderKeyPromptMessage(providerId: string): string {
  const configHint =
    providerCliMetadata[providerId as keyof typeof providerCliMetadata]
      ?.defaultKakaoSenderKey;
  return configHint
    ? `Kakao senderKey/profileId (optional, config hint: ${configHint})`
    : "Kakao senderKey/profileId (optional)";
}

function buildPlusIdPromptMessage(
  providerId: string,
  plusIdInference: string | undefined,
): string {
  if (plusIdInference === "unsupported") {
    return `Kakao plusId (required for ${providerId} preflight/send readiness)`;
  }
  return "Kakao plusId (optional)";
}

function shouldPromptForPlusId(
  spec:
    | {
        plusIdInference: string;
        plusIdPolicy: string;
      }
    | undefined,
): boolean {
  if (!spec) return false;
  if (spec.plusIdPolicy === "required") return true;
  return (
    spec.plusIdPolicy === "required_if_no_inference" &&
    spec.plusIdInference === "unsupported"
  );
}

async function promptProviderSelection(input: {
  defaultProviderId: string | undefined;
  message: string;
  prompt: PromptApi;
  providers: ProviderWithCapabilities[];
}): Promise<ProviderWithCapabilities> {
  if (input.providers.length === 0) {
    throw new Error("No compatible provider is configured");
  }
  if (input.providers.length === 1) {
    const only = input.providers[0];
    if (!only) {
      throw new Error("No compatible provider is configured");
    }
    return only;
  }

  const selected = await promptSelect(input.prompt, input.message, {
    options: input.providers.map((provider) => ({
      hint: `id: ${provider.id}`,
      label: provider.name,
      value: provider.id,
    })),
    default: input.defaultProviderId,
  });

  const match = input.providers.find((provider) => provider.id === selected);
  if (!match) {
    throw new Error(`Unknown provider id: ${selected}`);
  }
  return match;
}

async function promptMessageVariables(
  prompt: PromptApi,
  message: string,
): Promise<MessageVariables> {
  const raw = await promptText(prompt, {
    message,
    validate: (value) => {
      if (value.trim().length === 0) {
        return "Template variables JSON is required";
      }
      try {
        messageVariablesSchema.parse(parseJson(value, "template variables"));
        return true;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
  });

  return messageVariablesSchema.parse(
    parseJson(raw, "template variables"),
  ) as MessageVariables;
}

async function promptOptionalDate(
  prompt: PromptApi,
  message: string,
): Promise<Date | undefined> {
  const raw = await promptText(prompt, {
    message,
    validate: (value) => {
      if (value.trim().length === 0) return true;
      return isValidDateValue(value)
        ? true
        : "Expected an ISO date string (for example 2026-06-29T10:00:00+09:00)";
    },
  });

  const normalized = normalizeOptionalText(raw);
  if (!normalized) return undefined;

  return new Date(normalized);
}

async function promptKakaoAlias(input: {
  config: KMsgCliConfig;
  prompt: PromptApi;
  providerId: string;
  skipPrompt: boolean;
}): Promise<KakaoAliasSelection> {
  if (input.skipPrompt) return { mode: "skip" };
  const aliases = listKakaoAliases(input.config, input.providerId);
  if (aliases.length === 0) return { mode: "skip" };

  const defaultAlias = getDefaultKakaoAlias(input.config, input.providerId);
  const selected = await promptSelect(
    input.prompt,
    "Select Kakao channel alias",
    {
      options: [
        ...aliases.map((item) => ({
          hint: item.hint,
          label: item.label,
          value: item.alias,
        })),
        {
          label: "Manual senderKey / plusId entry",
          value: INTERACTIVE_PROVIDER_MANUAL,
        },
      ],
      default: defaultAlias,
    },
  );

  return selected === INTERACTIVE_PROVIDER_MANUAL
    ? { mode: "manual" }
    : { mode: "alias", alias: selected };
}

function listKakaoAliases(
  config: KMsgCliConfig,
  providerId: string,
): KakaoAliasOption[] {
  const entries = Object.entries(config.aliases?.kakaoChannels ?? {});
  return entries
    .filter(([, value]) => value?.providerId === providerId)
    .map(([alias, value]) => ({
      alias,
      hint: formatKakaoAliasHint(value?.senderKey, value?.plusId),
      label: formatKakaoAliasLabel(alias, value?.name),
    }));
}

function formatKakaoAliasLabel(alias: string, name?: string): string {
  const parts = [alias, name ? `(${name})` : undefined].filter(
    (value): value is string => typeof value === "string",
  );

  return parts.join(" ");
}

function formatKakaoAliasHint(
  senderKey?: string,
  plusId?: string,
): string | undefined {
  const parts = [
    senderKey ? `senderKey=${senderKey}` : undefined,
    plusId ? `plusId=${plusId}` : undefined,
  ].filter((value): value is string => typeof value === "string");

  return parts.length > 0 ? parts.join(" | ") : undefined;
}

function getDefaultKakaoAlias(
  config: KMsgCliConfig,
  providerId: string,
): string | undefined {
  const alias = normalizeOptionalText(config.defaults?.kakao?.channel);
  if (!alias) return undefined;
  const entry = config.aliases?.kakaoChannels?.[alias];
  return entry?.providerId === providerId ? alias : undefined;
}

function resolveSmsDefaultFrom(
  config: KMsgCliConfig,
  providerId: string,
): string | undefined {
  const entry = config.providers.find((provider) => provider.id === providerId);
  const providerConfig = (entry?.config ?? {}) as Record<string, unknown>;

  const candidates = [
    providerConfig.sender,
    providerConfig.senderNumber,
    providerConfig.smsSenderNumber,
    providerConfig.defaultFrom,
  ];

  return candidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

function pickProviderForTypes(
  runtime: Runtime,
  types: readonly MessageType[],
  requestedProviderId?: string,
): ProviderWithCapabilities {
  if (requestedProviderId) {
    const provider = runtime.providersById.get(requestedProviderId);
    if (!provider) {
      throw new Error(`Unknown provider id: ${requestedProviderId}`);
    }
    if (!supportsAnyType(provider, types)) {
      throw new CapabilityNotSupportedError(
        `Provider '${requestedProviderId}' does not support ${types.join("/")}`,
      );
    }
    return provider;
  }

  const defaultProviderId = getDefaultProviderId(runtime, types);
  if (defaultProviderId) {
    const provider = runtime.providersById.get(defaultProviderId);
    if (provider && supportsAnyType(provider, types)) {
      return provider;
    }
  }

  const match = runtime.providers.find((provider) =>
    supportsAnyType(provider, types),
  );
  if (match) return match;

  throw new CapabilityNotSupportedError(
    `No configured provider supports ${types.join("/")}`,
  );
}

function getProvidersForTypes(
  runtime: Runtime,
  types: readonly MessageType[],
): ProviderWithCapabilities[] {
  return runtime.providers.filter((provider) =>
    supportsAnyType(provider, types),
  );
}

function getDefaultProviderId(
  runtime: Runtime,
  types: readonly MessageType[],
): string | undefined {
  for (const type of types) {
    const route = runtime.config.routing?.byType?.[type];
    const routeIds = normalizeRouteIds(route);
    const matched = routeIds.find((id) => {
      const provider = runtime.providersById.get(id);
      return provider ? supportsAnyType(provider, types) : false;
    });
    if (matched) return matched;
  }

  const defaultProviderId = normalizeOptionalText(
    runtime.config.routing?.defaultProviderId,
  );
  if (defaultProviderId) {
    const provider = runtime.providersById.get(defaultProviderId);
    if (provider && supportsAnyType(provider, types)) {
      return defaultProviderId;
    }
  }

  return runtime.providers.find((provider) => supportsAnyType(provider, types))
    ?.id;
}

function normalizeRouteIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }
  return typeof value === "string" && value.trim().length > 0 ? [value] : [];
}

function supportsAnyType(
  provider: ProviderWithCapabilities,
  types: readonly MessageType[],
): boolean {
  return types.some((type) => provider.supportedTypes.includes(type));
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeRequiredText(value: string | undefined): string | undefined {
  return normalizeOptionalText(value);
}

function preserveRequiredText(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().length > 0 ? value : undefined;
}

function resolveInteractiveSmsType(
  config: KMsgCliConfig,
  text: string,
  explicitType: "SMS" | "LMS" | "MMS" | undefined,
): "SMS" | "LMS" | "MMS" {
  if (explicitType) return explicitType;
  return estimateSmsBytes(text) > getAutoLmsThreshold(config) ? "LMS" : "SMS";
}

function getAutoLmsThreshold(config: KMsgCliConfig): number {
  const threshold = config.defaults?.sms?.autoLmsBytes;
  return typeof threshold === "number" && threshold > 0 ? threshold : 90;
}

function estimateSmsBytes(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    bytes += code <= 0x7f ? 1 : 2;
  }
  return bytes;
}

function isValidDateValue(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}
