// Types

// Kakao Channel Management
export { KakaoChannelManager } from "./kakao/channel";
export { KakaoSenderNumberManager } from "./kakao/sender-number";
// Channel Management
export {
  type AuditLogEntry,
  ChannelCRUD,
  type ChannelCRUDOptions,
  type PaginatedResult,
  type PaginationOptions,
} from "./management/crud";
export {
  type AccessContext,
  ActionType,
  type Permission,
  type PermissionCheck,
  PermissionManager,
  type PermissionResult,
  PermissionScope,
  ResourceType,
  type Role,
  type User,
} from "./management/permissions";
// Legacy Channel Service (maintained for backward compatibility)
export { ChannelService } from "./services/channel.service";
export * from "./types/channel.types";
// Verification Systems
export {
  type AutoVerificationResult,
  type BusinessInfo,
  BusinessVerifier,
  type BusinessVerifierOptions,
  type DocumentValidationResult,
  type VerificationRequest,
} from "./verification/business.verify";
export {
  NumberVerifier,
  type NumberVerifierOptions,
  type PhoneNumberInfo,
  type PhoneVerificationRequest,
  type PhoneVerificationStatus,
  type SMSProvider,
  type VerificationAttempt,
  VerificationMethod,
  VerificationType,
  type VoiceProvider,
} from "./verification/number.verify";
