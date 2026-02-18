/**
 * @k-msg/provider
 *
 * Provider implementations for the unified `SendOptions + Result` API.
 */

export {
  AligoProvider,
  AligoProviderFactory,
  createAligoProvider,
  createDefaultAligoProvider,
  initializeAligo,
} from "./aligo/provider";
export type { AligoConfig } from "./aligo/types/aligo";

export {
  createDefaultIWINVProvider,
  createIWINVProvider,
  IWINVProvider,
  IWINVProviderFactory,
  initializeIWINV,
} from "./iwinv/provider";
export type { IWINVConfig } from "./iwinv/types/iwinv";
export {
  getProviderOnboardingSpec,
  listProviderOnboardingSpecs,
  providerOnboardingSpecs,
} from "./onboarding/specs";
export {
  providerConfigFieldSpecs,
  type ProviderConfigFieldMap,
  type ProviderConfigFieldSpec,
  type ProviderConfigFieldType,
  type ProviderTypeWithConfig,
} from "./config-fields";
export { MockProvider } from "./providers/mock/mock.provider";
