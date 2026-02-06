/**
 * IWINV Provider Adapter
 * IWINV API를 표준 인터페이스로 변환하는 어댑터
 */
import { BaseProviderAdapter, StandardRequest, StandardResult, StandardError, ProviderConfig, AdapterFactory, ProviderMetadata } from '@k-msg/core';
export interface IWINVRequest {
    templateCode: string;
    reserve?: 'Y' | 'N';
    sendDate?: string;
    reSend?: 'Y' | 'N';
    resendCallback?: string;
    resendType?: 'Y' | 'N';
    resendTitle?: string;
    resendContent?: string;
    list: IWINVRecipient[];
}
export interface IWINVRecipient {
    phone: string;
    templateParam?: string[];
}
export interface IWINVResponse {
    code: number;
    message: string;
    success?: number;
    fail?: number;
    seqNo?: number;
}
export interface IWINVConfig extends ProviderConfig {
    userId?: string;
    senderNumber?: string;
}
/**
 * IWINV API 어댑터 구현
 */
export declare class IWINVAdapter extends BaseProviderAdapter {
    private readonly endpoints;
    constructor(config: IWINVConfig);
    adaptRequest(request: StandardRequest): IWINVRequest;
    adaptResponse(response: IWINVResponse): StandardResult;
    mapError(error: any): StandardError;
    getAuthHeaders(): Record<string, string>;
    getBaseUrl(): string;
    getEndpoint(operation: string): string;
    getRequestConfig(): RequestInit;
    isRetryableError(error: any): boolean;
    /**
     * IWINV 날짜 형식으로 변환 (yyyy-MM-dd HH:mm:ss)
     */
    private formatIWINVDate;
    /**
     * IWINV 상태 코드를 표준 상태로 매핑
     */
    private mapIWINVStatus;
    /**
     * IWINV 특화 기능: 예약 발송 취소
     */
    cancelScheduledMessage(messageId: string): Promise<boolean>;
    /**
     * IWINV 특화 기능: 잔액 조회
     */
    getBalance(): Promise<number>;
}
/**
 * IWINV 어댑터 팩토리
 */
export declare class IWINVAdapterFactory implements AdapterFactory {
    create(config: ProviderConfig): BaseProviderAdapter;
    supports(providerId: string): boolean;
    getMetadata(): ProviderMetadata;
}
