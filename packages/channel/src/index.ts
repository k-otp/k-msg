// Types
export * from './types/channel.types';

// Kakao Channel Management
export { KakaoChannelManager } from './kakao/channel';
export { KakaoSenderNumberManager } from './kakao/sender-number';

// Channel Management
export { 
  ChannelCRUD,
  type PaginationOptions,
  type PaginatedResult,
  type ChannelCRUDOptions,
  type AuditLogEntry
} from './management/crud';

export { 
  PermissionManager,
  type User,
  type Role,
  type Permission,
  type AccessContext,
  type PermissionCheck,
  type PermissionResult,
  ResourceType,
  ActionType,
  PermissionScope
} from './management/permissions';

// Verification Systems
export { 
  BusinessVerifier,
  type BusinessInfo,
  type VerificationRequest,
  type AutoVerificationResult,
  type DocumentValidationResult,
  type BusinessVerifierOptions
} from './verification/business.verify';

export { 
  NumberVerifier,
  type PhoneVerificationRequest,
  type VerificationAttempt,
  type PhoneVerificationStatus,
  type NumberVerifierOptions,
  type SMSProvider,
  type VoiceProvider,
  type PhoneNumberInfo,
  VerificationType,
  VerificationMethod
} from './verification/number.verify';

// Legacy Channel Service (maintained for backward compatibility)
export { ChannelService } from './services/channel.service';