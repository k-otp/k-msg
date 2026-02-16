import type {
  KakaoChannelProvider,
  Provider,
  TemplateInspectionProvider,
  TemplateProvider,
} from "@k-msg/core";
import {
  AligoProvider,
  IWINVProvider,
  MockProvider,
  SolapiProvider,
} from "@k-msg/provider";
import type { KMsgCliConfig } from "../config/schema";

export type ProviderWithCapabilities = Provider &
  Partial<TemplateProvider & TemplateInspectionProvider & KakaoChannelProvider>;

function wrapProviderId(
  provider: ProviderWithCapabilities,
  id: string,
): ProviderWithCapabilities {
  if (provider.id === id) return provider;

  const wrapped: ProviderWithCapabilities = {
    id,
    name: provider.name,
    supportedTypes: provider.supportedTypes,
    healthCheck: () => provider.healthCheck(),
    send: (params) => provider.send(params),
    ...(typeof provider.getDeliveryStatus === "function"
      ? { getDeliveryStatus: provider.getDeliveryStatus.bind(provider) }
      : {}),
    ...(typeof provider.getOnboardingSpec === "function"
      ? { getOnboardingSpec: provider.getOnboardingSpec.bind(provider) }
      : {}),
  };

  const any = provider as unknown as Record<string, unknown>;
  if (typeof any.createTemplate === "function") {
    (wrapped as unknown as TemplateProvider).createTemplate = (
      any.createTemplate as any
    ).bind(provider);
  }
  if (typeof any.updateTemplate === "function") {
    (wrapped as unknown as TemplateProvider).updateTemplate = (
      any.updateTemplate as any
    ).bind(provider);
  }
  if (typeof any.deleteTemplate === "function") {
    (wrapped as unknown as TemplateProvider).deleteTemplate = (
      any.deleteTemplate as any
    ).bind(provider);
  }
  if (typeof any.getTemplate === "function") {
    (wrapped as unknown as TemplateProvider).getTemplate = (
      any.getTemplate as any
    ).bind(provider);
  }
  if (typeof any.listTemplates === "function") {
    (wrapped as unknown as TemplateProvider).listTemplates = (
      any.listTemplates as any
    ).bind(provider);
  }
  if (typeof any.requestTemplateInspection === "function") {
    (
      wrapped as unknown as TemplateInspectionProvider
    ).requestTemplateInspection = (any.requestTemplateInspection as any).bind(
      provider,
    );
  }

  if (typeof any.listKakaoChannels === "function") {
    (wrapped as unknown as KakaoChannelProvider).listKakaoChannels = (
      any.listKakaoChannels as any
    ).bind(provider);
  }
  if (typeof any.listKakaoChannelCategories === "function") {
    (wrapped as unknown as KakaoChannelProvider).listKakaoChannelCategories = (
      any.listKakaoChannelCategories as any
    ).bind(provider);
  }
  if (typeof any.requestKakaoChannelAuth === "function") {
    (wrapped as unknown as KakaoChannelProvider).requestKakaoChannelAuth = (
      any.requestKakaoChannelAuth as any
    ).bind(provider);
  }
  if (typeof any.addKakaoChannel === "function") {
    (wrapped as unknown as KakaoChannelProvider).addKakaoChannel = (
      any.addKakaoChannel as any
    ).bind(provider);
  }

  return wrapped;
}

export function createProviders(
  config: KMsgCliConfig,
): ProviderWithCapabilities[] {
  const providers: ProviderWithCapabilities[] = [];

  for (const entry of config.providers) {
    const cfg = entry.config as Record<string, unknown>;
    let provider: ProviderWithCapabilities;

    switch (entry.type) {
      case "solapi": {
        provider = new SolapiProvider(cfg as any) as ProviderWithCapabilities;
        break;
      }
      case "iwinv": {
        provider = new IWINVProvider(cfg as any) as ProviderWithCapabilities;
        break;
      }
      case "aligo": {
        provider = new AligoProvider(cfg as any) as ProviderWithCapabilities;
        break;
      }
      case "mock": {
        provider = new MockProvider() as ProviderWithCapabilities;
        break;
      }
      default: {
        const exhaustive: never = entry.type;
        throw new Error(`Unsupported provider type: ${String(exhaustive)}`);
      }
    }

    providers.push(wrapProviderId(provider, entry.id));
  }

  return providers;
}
