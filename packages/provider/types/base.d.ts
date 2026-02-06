/**
 * 공통 프로바이더 인터페이스와 타입 정의
 * 모든 K-Message 프로바이더가 구현해야 하는 기본 인터페이스
 * 알림톡, 친구톡, SMS, LMS 등 다양한 메시징 채널 지원
 */
export declare enum MessageChannel {
    ALIMTALK = "alimtalk",// 카카오 알림톡
    FRIENDTALK = "friendtalk",// 카카오 친구톡
    SMS = "sms",// 단문 메시지
    LMS = "lms",// 장문 메시지
    MMS = "mms",// 멀티미디어 메시지
    PUSH = "push",// 푸시 알림
    EMAIL = "email"
}
export declare enum MessageType {
    TEXT = "text",// 텍스트만
    RICH = "rich",// 리치 메시지 (버튼, 이미지 등)
    TEMPLATE = "template",// 템플릿 기반
    CUSTOM = "custom"
}
export interface SendOptions {
    channel?: MessageChannel;
    messageType?: MessageType;
    reserve?: boolean;
    sendDate?: Date | string;
    timezone?: string;
    senderKey?: string;
    senderNumber?: string;
    senderName?: string;
    enableFallback?: boolean;
    fallbackChannel?: MessageChannel;
    fallbackContent?: string;
    fallbackTitle?: string;
    title?: string;
    subject?: string;
    priority?: 'high' | 'normal' | 'low';
    trackingId?: string;
    campaignId?: string;
    tags?: string[];
    attachments?: MediaAttachment[];
    metadata?: Record<string, any>;
}
export interface MediaAttachment {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    filename?: string;
    size?: number;
    mimeType?: string;
}
export interface TemplateFilters {
    templateCode?: string;
    templateName?: string;
    templateStatus?: string;
    [key: string]: any;
}
export interface HistoryFilters {
    reserve?: 'Y' | 'N' | boolean;
    startDate?: string | Date;
    endDate?: string | Date;
    messageId?: number | string;
    phone?: string;
    [key: string]: any;
}
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
export interface BaseProvider<TConfig = any> {
    readonly id: string;
    readonly name: string;
    readonly supportedChannels: MessageChannel[];
    readonly supportedTypes: MessageType[];
    healthCheck(): Promise<HealthCheckResult>;
    sendMessage?(recipient: string, // 수신자 (전화번호 또는 이메일)
    content: MessageContent, options?: SendOptions): Promise<SendResult>;
    sendTemplateMessage?(templateCode: string, phoneNumber: string, variables: Record<string, any>, options?: SendOptions): Promise<SendResult>;
    createTemplate?(template: TemplateCreateRequest): Promise<TemplateResult>;
    getTemplates?(pageNum?: number, pageSize?: number, filters?: TemplateFilters): Promise<any>;
    modifyTemplate?(templateCode: string, template: TemplateUpdateRequest): Promise<TemplateResult>;
    deleteTemplate?(templateCode: string): Promise<any>;
    getHistory?(pageNum?: number, pageSize?: number, filters?: HistoryFilters): Promise<any>;
    cancelReservation?(messageId: number | string): Promise<any>;
    getSenderNumbers?(): Promise<SenderNumber[]>;
    verifySenderNumber?(phoneNumber: string): Promise<SenderVerificationResult>;
    getChannelInfo?(channel: MessageChannel): Promise<ChannelInfo>;
}
export interface MessageContent {
    channel?: MessageChannel;
    type?: MessageType;
    text: string;
    title?: string;
    templateId?: string;
    variables?: Record<string, any>;
    buttons?: MessageButton[];
    attachments?: MediaAttachment[];
}
export interface MessageButton {
    type: 'web' | 'app' | 'phone' | 'delivery';
    text: string;
    url?: string;
    scheme?: string;
    phoneNumber?: string;
}
export interface TemplateCreateRequest {
    name: string;
    content: string;
    channel: MessageChannel;
    category?: string;
    buttons?: MessageButton[];
    variables?: string[];
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
    status: 'active' | 'pending' | 'rejected' | 'blocked';
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
        maxLength?: number;
        maxAttachments?: number;
        maxAttachmentSize?: number;
    };
    features: {
        supportsButtons: boolean;
        supportsAttachments: boolean;
        supportsTemplates: boolean;
        supportsScheduling: boolean;
    };
}
export interface BaseProviderConfig {
    apiKey: string;
    baseUrl?: string;
    debug?: boolean;
    timeout?: number;
    retries?: number;
}
