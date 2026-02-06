/**
 * Improved BaseProvider Architecture
 * 진짜 "Base"에 집중한 최소한의 인터페이스
 */

export interface ProviderHealthStatus {
  healthy: boolean;
  issues: string[];
  latency?: number;
  data?: Record<string, unknown>;
}

// 1. 진짜 Base Provider - 제네릭으로 추상화된 공통 분모
export interface BaseProvider<TRequest = unknown, TResult = unknown> {
  // Identity
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly version: string;

  // Lifecycle
  configure(config: Record<string, unknown>): void;
  isReady(): boolean;
  healthCheck(): Promise<ProviderHealthStatus>;
  destroy(): void;

  // Core operation - 제네릭으로 추상화
  send<T extends TRequest = TRequest, R extends TResult = TResult>(
    request: T
  ): Promise<R>;

  // Status tracking
  getStatus(requestId: string): Promise<DeliveryStatus>;
  cancel?(requestId: string): Promise<boolean>;

  // Capabilities discovery
  getCapabilities(): ProviderCapabilities;
  getSupportedFeatures(): string[];
  getConfigurationSchema(): ConfigurationSchema;
}

// 2. Provider Type 정의
export type ProviderType =
  | 'messaging'    // AlimTalk, KakaoTalk 등
  | 'sms'         // SMS 발송
  | 'email'       // 이메일 발송
  | 'push'        // Push 알림
  | 'voice';      // 음성 통화

// 3. 메시징 Provider - BaseProvider 확장 (제네릭 특화)
export interface MessagingProvider extends BaseProvider<MessageRequest, MessageResult> {
  readonly type: 'messaging';

  // 메시징 전용 추가 기능
  sendBulk?(messages: MessageRequest[]): Promise<BulkMessageResult>;
  schedule?(message: MessageRequest, scheduledAt: Date): Promise<ScheduleResult>;
}

// 4. SMS Provider 예시 - BaseProvider 확장 (제네릭 특화)
export interface SMSProvider extends BaseProvider<SMSRequest, SMSResult> {
  readonly type: 'sms';

  // SMS 전용 추가 기능 (기본 send는 BaseProvider에서 상속)
  sendBulkSMS?(requests: SMSRequest[]): Promise<BulkSMSResult>;
}

export interface SMSRequest {
  phoneNumber: string;
  text: string;
  options?: SMSOptions;
}

export interface SMSOptions {
  priority?: 'high' | 'normal' | 'low';
  encoding?: 'UTF-8' | 'EUC-KR';
  scheduledAt?: Date;
}

export interface SMSResult {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
  error?: ErrorInfo;
}

export interface BulkSMSResult {
  requestId: string;
  results: SMSResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

// 5. Email Provider 예시 - BaseProvider 확장 (제네릭 특화)
export interface EmailProvider extends BaseProvider<EmailRequest, EmailResult> {
  readonly type: 'email';

  // Email 전용 추가 기능
  sendBulkEmail?(requests: EmailRequest[]): Promise<BulkEmailResult>;
  sendTemplate?(templateId: string, to: string[], data: Record<string, unknown>): Promise<EmailResult>;
}

export interface EmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: EmailContent;
  attachments?: EmailAttachment[];
  options?: EmailOptions;
}

export interface EmailContent {
  type: 'text' | 'html' | 'template';
  body: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  priority?: 'high' | 'normal' | 'low';
  tracking?: boolean;
  scheduledAt?: Date;
  replyTo?: string;
}

export interface EmailResult {
  messageId: string;
  status: DeliveryStatus;
  timestamp: Date;
  error?: ErrorInfo;
}

export interface BulkEmailResult {
  requestId: string;
  results: EmailResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

// 6. 추상적인 메시지 타입들
export interface MessageRequest {
  recipient: string;
  content: MessageContent;
  options?: MessageOptions;
}

export interface MessageOptions {
  priority?: 'high' | 'normal' | 'low';
  ttl?: number;
  tracking?: boolean;
  webhookUrl?: string;
  scheduledAt?: Date;
}

export interface MessageContent {
  type: 'template' | 'text' | 'rich';
  data: Record<string, unknown>;
}

export interface MessageResult {
  messageId: string;
  status: MessageStatus;
  provider: string;
  timestamp: Date;
  error?: ErrorInfo;
}

export interface BulkMessageResult {
  requestId: string;
  results: MessageResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface ScheduleResult {
  scheduleId: string;
  messageId: string;
  scheduledAt: Date;
  status: 'scheduled' | 'cancelled';
}

// 공통 상태 추적 인터페이스
export interface DeliveryStatus {
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface MessageStatus extends DeliveryStatus {}

// 7. 에러 정보
export interface ErrorInfo {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// 8. 설정 스키마
export interface ConfigurationSchema {
  required: ConfigField[];
  optional: ConfigField[];
}

export interface ConfigField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'url' | 'secret';
  description: string;
  validation?: ValidationRule;
}

export interface ValidationRule {
  pattern?: string;
  min?: number;
  max?: number;
  enum?: string[];
}

// 9. 최소한의 Capabilities
export interface ProviderCapabilities {
  maxConcurrency?: number;
  rateLimit?: {
    requests: number;
    per: 'second' | 'minute' | 'hour' | 'day';
  };
  retry?: {
    maxAttempts: number;
    backoffType: 'linear' | 'exponential';
  };
  // Provider별 세부사항은 각자 확장
  [key: string]: unknown;
}

// 10. Provider Factory 패턴 (제네릭 지원)
export interface ProviderFactory<
  T extends BaseProvider<TRequest, TResult> = BaseProvider,
  TRequest = unknown,
  TResult = unknown
> {
  create(config: Record<string, unknown>): T;
  getType(): ProviderType;
  getName(): string;
  validateConfig(config: Record<string, unknown>): boolean;

  // 타입 정보 제공
  getRequestType(): string;
  getResultType(): string;
}

// 11. Provider Registry (제네릭 지원)
export class ProviderRegistry {
  private providers = new Map<string, BaseProvider>();
  private factories = new Map<string, ProviderFactory>();

  // Factory 등록 (제네릭 타입별)
  registerFactory<
    T extends BaseProvider<TRequest, TResult>,
    TRequest = unknown,
    TResult = unknown
  >(
    type: ProviderType,
    name: string,
    factory: ProviderFactory<T, TRequest, TResult>
  ): void {
    this.factories.set(`${type}:${name}`, factory);
  }

  // Provider 생성 (타입 안전)
  create<
    T extends BaseProvider<TRequest, TResult>,
    TRequest = unknown,
    TResult = unknown
  >(
    type: ProviderType,
    name: string,
    config: Record<string, unknown>
  ): T {
    const factory = this.factories.get(`${type}:${name}`);
    if (!factory) {
      throw new Error(`Provider factory not found: ${type}:${name}`);
    }
    return factory.create(config) as T;
  }

  // Provider 등록
  register(provider: BaseProvider): void {
    this.providers.set(provider.id, provider);
  }

  // 타입별 Provider 조회 (타입 안전)
  getByType<T extends BaseProvider>(type: ProviderType): T[] {
    return Array.from(this.providers.values())
      .filter(p => p.type === type) as T[];
  }

  // ID로 Provider 조회 (타입 안전)
  get<T extends BaseProvider>(id: string): T | undefined {
    return this.providers.get(id) as T;
  }

  // 제네릭 send 래퍼 (타입 안전한 메시지 전송)
  async send<TRequest, TResult>(
    providerId: string,
    request: TRequest
  ): Promise<TResult> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return provider.send(request) as Promise<TResult>;
  }
}

// 12. 사용 예시 - 제네릭의 힘

// AlimTalk Provider 구현 예시
export interface AlimTalkRequest extends MessageRequest {
  templateCode: string;
  phoneNumber: string;
  variables: Record<string, unknown>;
  senderNumber?: string;
}

export interface AlimTalkResult extends MessageResult {
  templateCode: string;
  phoneNumber: string;
  deliveredAt?: Date;
}

export interface AlimTalkProvider extends BaseProvider<AlimTalkRequest, AlimTalkResult> {
  readonly type: 'messaging';

  // BaseProvider의 제네릭 send가 자동으로 AlimTalkRequest -> AlimTalkResult로 타입화됨
  // send(request: AlimTalkRequest): Promise<AlimTalkResult>; // 자동 제공

  // AlimTalk 전용 기능들
  sendBulk?(requests: AlimTalkRequest[]): Promise<BulkAlimTalkResult>;
  getTemplates?(): Promise<AlimTalkTemplate[]>;
  createTemplate?(template: AlimTalkTemplateRequest): Promise<AlimTalkTemplate>;
}

export interface BulkAlimTalkResult {
  requestId: string;
  results: AlimTalkResult[];
  summary: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface AlimTalkTemplate {
  id: string;
  code: string;
  name: string;
  content: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface AlimTalkTemplateRequest {
  name: string;
  content: string;
  variables: TemplateVariable[];
  buttons?: TemplateButton[];
}

export interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
}

export interface TemplateButton {
  type: string;
  name: string;
  url?: string;
}

// 사용법 예시:
// const registry = new ProviderRegistry();
// const alimTalkProvider: AlimTalkProvider = registry.create<AlimTalkProvider, AlimTalkRequest, AlimTalkResult>('messaging', 'iwinv', config);
//
// // 타입 안전한 메시지 전송
// const result: AlimTalkResult = await alimTalkProvider.send({
//   recipient: '01012345678',
//   content: { type: 'template', data: {} },
//   templateCode: 'WELCOME_001',
//   phoneNumber: '01012345678',
//   variables: { name: 'John' }
// });
//
// // Registry를 통한 타입 안전한 전송
// const result2 = await registry.send<AlimTalkRequest, AlimTalkResult>('iwinv-provider', {
//   recipient: '01012345678',
//   content: { type: 'template', data: {} },
//   templateCode: 'WELCOME_001',
//   phoneNumber: '01012345678',
//   variables: { name: 'Jane' }
// });