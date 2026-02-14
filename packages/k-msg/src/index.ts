/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Unified package that re-exports core functionality for easy use
 */

export * from "@k-msg/core";
export { KMsg } from "@k-msg/messaging";
export { AligoProvider, IWINVProvider, MockProvider, SolapiProvider } from "@k-msg/provider";
export type { AligoConfig, IWINVConfig, SolapiConfig } from "@k-msg/provider";
