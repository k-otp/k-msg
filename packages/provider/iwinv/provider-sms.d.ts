/**
 * IWINV SMS Provider - New Adapter Pattern Implementation
 * 새 어댑터 패턴을 사용한 IWINV SMS 프로바이더 구현
 */
import { IWINVProvider } from './provider';
import type { IWINVConfig } from './types/iwinv';
/**
 * SMS 특화 IWINV 프로바이더
 * 새 어댑터 패턴 기반으로 SMS 기능에 최적화
 */
export declare class IWINVSMSProvider extends IWINVProvider {
    constructor(config: IWINVConfig);
    /**
     * SMS 전송 (표준 인터페이스 사용)
     */
    sendSMS(phoneNumber: string, message: string, options?: {
        senderNumber?: string;
        scheduledAt?: Date;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<StandardResult>;
    /**
     * LMS 전송 (긴 문자 메시지)
     */
    sendLMS(phoneNumber: string, subject: string, message: string, options?: {
        senderNumber?: string;
        scheduledAt?: Date;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<StandardResult>;
    /**
     * 대량 SMS 전송
     */
    sendBulkSMS(recipients: Array<{
        phoneNumber: string;
        message: string;
        variables?: Record<string, string>;
    }>, options?: {
        senderNumber?: string;
        scheduledAt?: Date;
        batchSize?: number;
    }): Promise<any[]>;
    /**
     * SMS/LMS 자동 판별 전송
     */
    sendMessage(phoneNumber: string, message: string, options?: {
        senderNumber?: string;
        scheduledAt?: Date;
        subject?: string;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<StandardResult>;
}
/**
 * SMS Provider 팩토리 함수들
 */
export declare const createIWINVSMSProvider: (config: IWINVConfig) => IWINVSMSProvider;
export declare const createDefaultIWINVSMSProvider: () => IWINVSMSProvider;
