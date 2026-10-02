/**
 * @k-msg/provider
 *
 * Provider implementations for the unified `SendOptions + Result` API.
 *
 * SOLAPI symbols are exported only from `@k-msg/provider/solapi`.
 * Install `solapi` in your app when using SOLAPI providers.
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
  providerConfigKeyAlternatives,
} from "./config-fields";
export { getIWINVSendErrorReason } from "./iwinv/iwinv.send-error";
export {
  createDefaultIWINVProvider,
  createIWINVProvider,
  IWINVProvider,
  IWINVProviderFactory,
  initializeIWINV,
} from "./iwinv/provider";
export {
  IWINV_SEND_ERROR_REASONS,
  type IWINVConfig,
  type IWINVSendErrorReason,
} from "./iwinv/types/iwinv";
export {
  getProviderOnboardingSpec,
  listProviderOnboardingSpecs,
  providerOnboardingSpecs,
} from "./onboarding/specs";
export {
  type ProviderCliMetadata,
  providerCliMetadata,
} from "./provider-cli-metadata";
export {
  MockProvider,
  type MockProviderOptions,
} from "./providers/mock/mock.provider";
