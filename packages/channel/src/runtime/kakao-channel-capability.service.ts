import type { ProviderOnboardingSpec } from "@k-msg/core";
import type {
  KakaoChannelCapability,
  KakaoChannelCapabilityMode,
  KakaoChannelRuntimeProvider,
} from "./types";

function hasFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

function tryGetOnboardingSpec(
  provider: KakaoChannelRuntimeProvider,
): ProviderOnboardingSpec | undefined {
  if (!hasFunction(provider.getOnboardingSpec)) {
    return undefined;
  }

  try {
    return provider.getOnboardingSpec();
  } catch {
    return undefined;
  }
}

function normalizeProviderType(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : undefined;
}

function inferMode(
  spec: ProviderOnboardingSpec | undefined,
  supportsList: boolean,
): KakaoChannelCapabilityMode {
  if (spec?.channelOnboarding) {
    if (spec.channelOnboarding === "api" && !supportsList) {
      return "none";
    }
    return spec.channelOnboarding;
  }

  return supportsList ? "api" : "none";
}

export class KakaoChannelCapabilityService {
  resolve(provider: KakaoChannelRuntimeProvider): KakaoChannelCapability {
    const spec = tryGetOnboardingSpec(provider);

    const supports = {
      list: hasFunction(provider.listKakaoChannels),
      categories: hasFunction(provider.listKakaoChannelCategories),
      auth: hasFunction(provider.requestKakaoChannelAuth),
      add: hasFunction(provider.addKakaoChannel),
    };

    const providerType = normalizeProviderType(spec?.providerId);
    const mode = inferMode(spec, supports.list);

    return {
      providerId: provider.id,
      ...(providerType ? { providerType } : {}),
      mode,
      supports,
    };
  }
}
