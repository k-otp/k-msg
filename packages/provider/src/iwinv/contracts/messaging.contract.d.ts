/**
 * IWINV Messaging Contract Implementation
 */
import { MessagingContract, ProviderMessageRequest, ProviderMessageResult, ProviderBulkResult, ScheduleResult, MessageStatus } from '../../contracts/provider.contract';
import { IWINVConfig } from '../types/iwinv';
export declare class IWINVMessagingContract implements MessagingContract {
    private config;
    constructor(config: IWINVConfig);
    send(message: ProviderMessageRequest): Promise<ProviderMessageResult>;
    sendBulk(messages: ProviderMessageRequest[]): Promise<ProviderBulkResult>;
    schedule(message: ProviderMessageRequest, scheduledAt: Date): Promise<ScheduleResult>;
    cancel(messageId: string): Promise<void>;
    getStatus(messageId: string): Promise<MessageStatus>;
}
//# sourceMappingURL=messaging.contract.d.ts.map