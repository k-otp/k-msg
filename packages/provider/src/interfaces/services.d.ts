export interface MessagingService {
    sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
    sendBulk(params: BulkMessageParams): Promise<BulkMessageResult>;
    getDeliveryStatus?(messageId: string): Promise<DeliveryStatus>;
}
export interface SchedulingService {
    schedule(params: ScheduleMessageParams): Promise<ScheduleResult>;
    cancelSchedule(params: CancelScheduleParams): Promise<void>;
    modifySchedule?(params: ModifyScheduleParams): Promise<ScheduleResult>;
}
export interface TemplatingService {
    createTemplate(params: TemplateParams): Promise<Template>;
    updateTemplate(templateId: string, params: TemplateParams): Promise<Template>;
    deleteTemplate(templateId: string): Promise<void>;
    getTemplate(templateId: string): Promise<Template>;
    listTemplates(params?: ListTemplatesParams): Promise<TemplateList>;
    validateTemplate(params: TemplateParams): Promise<ValidationResult>;
}
export interface AnalyticsService {
    getStats(params: AnalyticsParams): Promise<AnalyticsData>;
    getDeliveryReport(messageId: string): Promise<DeliveryReport>;
}
export interface WebhookService {
    registerWebhook(params: WebhookParams): Promise<WebhookRegistration>;
    updateWebhook(webhookId: string, params: WebhookParams): Promise<WebhookRegistration>;
    deleteWebhook(webhookId: string): Promise<void>;
    listWebhooks(): Promise<WebhookRegistration[]>;
}
export interface BalanceService {
    getBalance(): Promise<BalanceInfo>;
    getRate?(): Promise<RateInfo>;
}
export interface HistoryService {
    getHistory(params: HistoryParams): Promise<HistoryList>;
    getMessageDetail(messageId: string): Promise<MessageDetail>;
}
export interface SendMessageParams {
    to: string;
    templateId?: string;
    message?: string;
    variables?: Record<string, string>;
    resend?: ResendConfig;
}
export interface BulkMessageParams {
    templateId: string;
    messages: Array<{
        to: string;
        variables?: Record<string, string>;
    }>;
    resend?: ResendConfig;
}
export interface ResendConfig {
    from: string;
    content?: string;
    title?: string;
}
export interface SendMessageResult {
    messageId: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    statusCode?: string;
    remainingBalance?: number;
    creditsUsed?: number;
}
export interface BulkMessageResult {
    messageIds: string[];
    successCount: number;
    failureCount: number;
    results: Array<{
        status: 'SUCCESS' | 'FAILED';
        statusCode?: string;
        messageId?: string;
    }>;
    remainingBalance?: number;
    creditsUsed?: number;
}
export interface ScheduleMessageParams {
    templateId: string;
    messages: Array<{
        to: string;
        variables?: Record<string, string>;
    }>;
    scheduledAt: Date;
    resend?: ResendConfig;
}
export interface ScheduleResult {
    scheduleId: string;
    scheduledAt: Date;
    messageCount: number;
}
export interface CancelScheduleParams {
    scheduleId: string;
}
export interface ModifyScheduleParams {
    scheduleId: string;
    scheduledAt?: Date;
    messages?: Array<{
        to: string;
        variables?: Record<string, string>;
    }>;
}
export interface TemplateParams {
    name: string;
    content: string;
    variables?: string[];
    buttons?: TemplateButton[];
}
export interface TemplateButton {
    type: string;
    name: string;
    linkMobile?: string;
    linkPc?: string;
    linkIos?: string;
    linkAndroid?: string;
}
export interface Template {
    id: string;
    name: string;
    content: string;
    status: 'ACTIVE' | 'PENDING' | 'REJECTED';
    variables: string[];
    buttons?: TemplateButton[];
    createdAt: Date;
    updatedAt: Date;
}
export interface ListTemplatesParams {
    page?: number;
    pageSize?: number;
    templateCode?: string;
    templateName?: string;
    status?: string;
}
export interface TemplateList {
    items: Template[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
export interface DeliveryStatus {
    messageId: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'EXPIRED';
    sentAt?: Date;
    deliveredAt?: Date;
    failureReason?: string;
}
export interface AnalyticsParams {
    startDate: Date;
    endDate: Date;
    templateIds?: string[];
    metrics?: string[];
}
export interface AnalyticsData {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    templateStats?: Record<string, any>;
}
export interface DeliveryReport {
    messageId: string;
    templateId?: string;
    recipient: string;
    status: string;
    sentAt: Date;
    deliveredAt?: Date;
    events: Array<{
        timestamp: Date;
        event: string;
        description?: string;
    }>;
}
export interface WebhookParams {
    url: string;
    events: string[];
    secretKey?: string;
}
export interface WebhookRegistration {
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    createdAt: Date;
}
export interface BalanceInfo {
    amount: number;
    currency: string;
    lastUpdated: Date;
}
export interface RateInfo {
    messageRate: number;
    currency: string;
    unit: string;
}
export interface HistoryParams {
    startDate?: Date;
    endDate?: Date;
    phoneNumber?: string;
    templateId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}
export interface HistoryList {
    items: MessageDetail[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}
export interface MessageDetail {
    messageId: string;
    phoneNumber: string;
    templateId?: string;
    content: string;
    status: string;
    sentAt: Date;
    deliveredAt?: Date;
    failureReason?: string;
    creditsUsed: number;
}
//# sourceMappingURL=services.d.ts.map