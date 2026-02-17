import type {
  KakaoChannelProvider,
  Provider,
  TemplateInspectionProvider,
  TemplateProvider,
} from "@k-msg/core";
import { AligoProvider, IWINVProvider, MockProvider } from "@k-msg/provider";
import type { KMsgCliConfig } from "../config/schema";

export type ProviderWithCapabilities = Provider &
  Partial<TemplateProvider & TemplateInspectionProvider & KakaoChannelProvider>;

type SolapiProviderConstructor = new (
  config: Record<string, unknown>,
) => ProviderWithCapabilities;

export type ProviderLoaders = {
  loadSolapiProvider: () => Promise<SolapiProviderConstructor>;
};

const SOLAPI_DEPENDENCY_ERROR_PREFIX =
  "SOLAPI provider is configured, but the `solapi` dependency could not be loaded.";

function buildSolapiDependencyError(cause: unknown): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(
    [
      SOLAPI_DEPENDENCY_ERROR_PREFIX,
      "Install it in the runtime app: `bun add solapi` or `npm i solapi`.",
      `Original error: ${detail}`,
    ].join("\n"),
  );
}

function isSolapiDependencyError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    error.message.includes(SOLAPI_DEPENDENCY_ERROR_PREFIX)
  );
}

const defaultProviderLoaders: ProviderLoaders = {
  async loadSolapiProvider() {
    const module = await import("@k-msg/provider/solapi");
    return module.SolapiProvider as SolapiProviderConstructor;
  },
};

function hasTemplateCapabilities(
  provider: ProviderWithCapabilities,
): provider is ProviderWithCapabilities & TemplateProvider {
  return (
    typeof provider.createTemplate === "function" &&
    typeof provider.updateTemplate === "function" &&
    typeof provider.deleteTemplate === "function" &&
    typeof provider.getTemplate === "function" &&
    typeof provider.listTemplates === "function"
  );
}

function hasTemplateInspectionCapability(
  provider: ProviderWithCapabilities,
): provider is ProviderWithCapabilities & TemplateInspectionProvider {
  return typeof provider.requestTemplateInspection === "function";
}

function hasKakaoChannelCapabilities(
  provider: ProviderWithCapabilities,
): provider is ProviderWithCapabilities & KakaoChannelProvider {
  return typeof provider.listKakaoChannels === "function";
}

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

  if (hasTemplateCapabilities(provider)) {
    wrapped.createTemplate = provider.createTemplate.bind(provider);
    wrapped.updateTemplate = provider.updateTemplate.bind(provider);
    wrapped.deleteTemplate = provider.deleteTemplate.bind(provider);
    wrapped.getTemplate = provider.getTemplate.bind(provider);
    wrapped.listTemplates = provider.listTemplates.bind(provider);
  }

  if (hasTemplateInspectionCapability(provider)) {
    wrapped.requestTemplateInspection =
      provider.requestTemplateInspection.bind(provider);
  }

  if (hasKakaoChannelCapabilities(provider)) {
    wrapped.listKakaoChannels = provider.listKakaoChannels.bind(provider);
    if (provider.listKakaoChannelCategories) {
      wrapped.listKakaoChannelCategories =
        provider.listKakaoChannelCategories.bind(provider);
    }
    if (provider.requestKakaoChannelAuth) {
      wrapped.requestKakaoChannelAuth =
        provider.requestKakaoChannelAuth.bind(provider);
    }
    if (provider.addKakaoChannel) {
      wrapped.addKakaoChannel = provider.addKakaoChannel.bind(provider);
    }
  }

  return wrapped;
}

export async function createProviders(
  config: KMsgCliConfig,
): Promise<ProviderWithCapabilities[]> {
  return createProvidersWithLoaders(config, defaultProviderLoaders);
}

export async function createProvidersWithLoaders(
  config: KMsgCliConfig,
  loaders: ProviderLoaders,
): Promise<ProviderWithCapabilities[]> {
  const providers: ProviderWithCapabilities[] = [];

  for (const entry of config.providers) {
    const cfg = entry.config;
    let provider: ProviderWithCapabilities;

    switch (entry.type) {
      case "solapi": {
        let SolapiProvider: SolapiProviderConstructor;
        try {
          SolapiProvider = await loaders.loadSolapiProvider();
        } catch (error) {
          if (isSolapiDependencyError(error)) {
            throw error;
          }
          throw buildSolapiDependencyError(error);
        }
        provider = new SolapiProvider(cfg);
        break;
      }
      case "iwinv": {
        provider = new IWINVProvider(
          cfg as ConstructorParameters<typeof IWINVProvider>[0],
        );
        break;
      }
      case "aligo": {
        provider = new AligoProvider(
          cfg as ConstructorParameters<typeof AligoProvider>[0],
        );
        break;
      }
      case "mock": {
        provider = new MockProvider();
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
