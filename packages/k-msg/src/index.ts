/**
 * K-Message: Korean Multi-Channel Messaging Platform
 * Unified package that re-exports core functionality for easy use
 */

// Re-export core result types
export { fail, ok, type Result } from "@k-msg/core";
// Re-export the main KMsg client
export { KMsg } from "@k-msg/messaging";

// Re-export essential types
export type {
  AligoConfig,
  ProviderMessageRequest,
  ProviderMessageResult,
} from "@k-msg/provider";
// Re-export the most essential classes for basic usage
export { AligoProvider, IWINVProvider } from "@k-msg/provider";

// Re-export simple modules for CLI/scripts
export {
  /** @deprecated Use KMsg instead */
  createKMsgAnalytics,
  /** @deprecated Use KMsg instead */
  createKMsgSender,
  /** @deprecated Use KMsg instead */
  createKMsgTemplates,
} from "./modules";

// Remove admin exports for now as they are incomplete
