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
  type ProviderConfigFieldMap,
  type ProviderConfigFieldSpec,
  type ProviderConfigFieldType,
  type ProviderTypeWithConfig,
  providerConfigFieldSpecs,
} from "./config-fields";
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
  type ProviderCliMetadata,
  providerCliMetadata,
} from "./provider-cli-metadata";
export { MockProvider } from "./providers/mock/mock.provider";
export type { SolapiConfig } from "./solapi";
export {
  createDefaultSolapiProvider,
  createSolapiProvider,
  initializeSolapi,
  SolapiProvider,
  SolapiProviderFactory,
} from "./solapi";
