export * from './plugin';
export * from './services';
export interface NotificationRequest {
    phoneNumber: string;
    message: string;
    templateCode?: string;
    variables?: Record<string, string>;
}
export interface NotificationResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    code?: string;
}
//# sourceMappingURL=index.d.ts.map