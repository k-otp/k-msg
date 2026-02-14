/**
 * 공통 프로바이더 인터페이스와 타입 정의
 * 모든 K-Message 프로바이더가 구현해야 하는 기본 인터페이스
 * 알림톡, 친구톡, SMS, LMS 등 다양한 메시징 채널 지원
 */

// =============================================================================
// 메시징 채널 타입들
// =============================================================================

export enum MessageChannel {
  ALIMTALK = "alimtalk", // 카카오 알림톡
  FRIENDTALK = "friendtalk", // 카카오 친구톡
  SMS = "sms", // 단문 메시지
  LMS = "lms", // 장문 메시지
  MMS = "mms", // 멀티미디어 메시지
  PUSH = "push", // 푸시 알림
  EMAIL = "email", // 이메일
}

export enum MessageType {
  TEXT = "text", // 텍스트만
  RICH = "rich", // 리치 메시지 (버튼, 이미지 등)
  TEMPLATE = "template", // 템플릿 기반
  CUSTOM = "custom", // 커스텀 형식
}

// =============================================================================
// 공통 옵션 타입들
// =============================================================================

export interface SendOptions {
  // 기본 발송 옵션
  channel?: MessageChannel; // 우선 발송 채널
  messageType?: MessageType; // 메시지 타입

  // 예약 발송
  reserve?: boolean; // 예약발송 여부
  sendDate?: Date | string; // 발송 시각
  timezone?: string; // 타임존

  // 발신자 정보
  senderKey?: string; // 발신자 키 (알림톡)
  senderNumber?: string; // 발신 번호 (SMS/LMS)
  senderName?: string; // 발신자 명

  // 대체 발송 (Fallback)
  enableFallback?: boolean; // 대체 발송 활성화
  fallbackChannel?: MessageChannel; // 대체 발송 채널
  fallbackContent?: string; // 대체 발송 내용
  fallbackTitle?: string; // LMS 제목

  // 메시지 옵션
  title?: string; // 메시지 제목 (LMS, 이메일)
  subject?: string; // 제목 (이메일)
  priority?: "high" | "normal" | "low"; // 우선순위

  // 추적 및 분석
  trackingId?: string; // 추적 ID
  campaignId?: string; // 캠페인 ID
  tags?: string[]; // 태그

  // 멀티미디어
  attachments?: MediaAttachment[]; // 첨부파일

  // 기타
  metadata?: Record<string, any>; // 메타데이터
}

export interface MediaAttachment {
  type: "image" | "video" | "audio" | "document";
  url: string;
  filename?: string;
  size?: number; // bytes
  mimeType?: string;
}

export interface TemplateFilters {
  templateCode?: string;
  templateName?: string;
  templateStatus?: string;
  [key: string]: any;
}

export interface HistoryFilters {
  reserve?: "Y" | "N" | boolean;
  startDate?: string | Date;
  endDate?: string | Date;
  messageId?: number | string;
  phone?: string;
  [key: string]: any;
}

// =============================================================================
// 공통 결과 타입들
// =============================================================================

export interface HealthCheckResult {
  healthy: boolean;
  issues: string[];
  data?: {
    balance?: number;
    status: string;
    code?: number;
    message?: string;
  } | null;
}

export interface SendResult {
  success: boolean;
  messageId: string | null;
  status: string;
  error: string | null;
}

export interface TemplateResult {
  success: boolean;
  templateCode: string | null;
  status: string;
  error: string | null;
}

// =============================================================================
// 기본 프로바이더 인터페이스
// =============================================================================

export interface BaseProvider<TConfig = any> {
  readonly id: string;
  readonly name: string;
  readonly supportedChannels: MessageChannel[]; // 지원하는 메시징 채널
  readonly supportedTypes: MessageType[]; // 지원하는 메시지 타입

  // 기본 기능
  healthCheck(): Promise<HealthCheckResult>;

  // 메시지 발송 (통합 인터페이스)
  sendMessage?(
    recipient: string, // 수신자 (전화번호 또는 이메일)
    content: MessageContent,
    options?: SendOptions,
  ): Promise<SendResult>;

  // 기존 호환성을 위한 템플릿 기반 발송
  sendTemplateMessage?(
    templateCode: string,
    phoneNumber: string,
    variables: Record<string, any>,
    options?: SendOptions,
  ): Promise<SendResult>;

  // 템플릿 관리
  createTemplate?(template: TemplateCreateRequest): Promise<TemplateResult>;
  getTemplates?(
    pageNum?: number,
    pageSize?: number,
    filters?: TemplateFilters,
  ): Promise<any>;
  modifyTemplate?(
    templateCode: string,
    template: TemplateUpdateRequest,
  ): Promise<TemplateResult>;
  deleteTemplate?(templateCode: string): Promise<any>;

  // 전송 내역
  getHistory?(
    pageNum?: number,
    pageSize?: number,
    filters?: HistoryFilters,
  ): Promise<any>;

  // 예약 관리
  cancelReservation?(messageId: number | string): Promise<any>;

  // 발신자 관리 (SMS/LMS용)
  getSenderNumbers?(): Promise<SenderNumber[]>;
  verifySenderNumber?(phoneNumber: string): Promise<SenderVerificationResult>;

  // 채널별 특화 기능
  getChannelInfo?(channel: MessageChannel): Promise<ChannelInfo>;
}

// 새로운 메시지 콘텐츠 인터페이스
export interface MessageContent {
  channel?: MessageChannel;
  type?: MessageType;
  text: string;
  title?: string; // LMS, 이메일 제목
  templateId?: string; // 템플릿 ID (있는 경우)
  variables?: Record<string, any>; // 템플릿 변수
  buttons?: MessageButton[]; // 버튼 목록
  attachments?: MediaAttachment[]; // 첨부파일
}

export interface MessageButton {
  type: "web" | "app" | "phone" | "delivery";
  text: string;
  url?: string;
  scheme?: string; // 앱 스킴
  phoneNumber?: string;
}

export interface TemplateCreateRequest {
  name: string;
  content: string;
  channel: MessageChannel;
  category?: string;
  buttons?: MessageButton[];
  variables?: string[]; // 사용되는 변수 목록
  description?: string;
}

export interface TemplateUpdateRequest {
  name?: string;
  content?: string;
  buttons?: MessageButton[];
  description?: string;
}

export interface SenderNumber {
  phoneNumber: string;
  name?: string;
  verified: boolean;
  verifiedAt?: Date;
  status: "active" | "pending" | "rejected" | "blocked";
}

export interface SenderVerificationResult {
  success: boolean;
  phoneNumber: string;
  status: string;
  verificationCode?: string;
  error?: string;
}

export interface ChannelInfo {
  channel: MessageChannel;
  available: boolean;
  limits: {
    maxLength?: number; // 최대 문자 수
    maxAttachments?: number; // 최대 첨부파일 수
    maxAttachmentSize?: number; // 최대 첨부파일 크기 (bytes)
  };
  features: {
    supportsButtons: boolean;
    supportsAttachments: boolean;
    supportsTemplates: boolean;
    supportsScheduling: boolean;
  };
}

// =============================================================================
// 프로바이더 설정 인터페이스
// =============================================================================

export interface BaseProviderConfig {
  apiKey: string;
  baseUrl?: string;
  debug?: boolean;
  timeout?: number;
  retries?: number;
}
