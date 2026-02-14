/**
 * @k-msg/provider
 *
 * Provider implementations for the unified `SendOptions + Result` API.
 */

export { AligoProvider, AligoProviderFactory, createAligoProvider, createDefaultAligoProvider, initializeAligo } from "./aligo/provider";
export type { AligoConfig } from "./aligo/types/aligo";

export { IWINVProvider, IWINVProviderFactory, createIWINVProvider, createDefaultIWINVProvider, initializeIWINV } from "./iwinv/provider";
export type { IWINVConfig } from "./iwinv/types/iwinv";

export { SolapiProvider, SolapiProviderFactory, createSolapiProvider, createDefaultSolapiProvider, initializeSolapi } from "./solapi/provider";
export type { SolapiConfig } from "./solapi/types/solapi";

export { MockProvider } from "./providers/mock/mock.provider";
