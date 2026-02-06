/**
 * IWINV Multi Provider - New Adapter Pattern Implementation
 * 새 어댑터 패턴을 사용한 IWINV 다중 프로바이더 구현
 */
import { IWINVProvider } from './provider';
import { IWINVSMSProvider } from './provider-sms';
import type { IWINVConfig } from './types/iwinv';
import type { StandardRequest, StandardResult } from '@k-msg/core';
/**
 * AlimTalk과 SMS를 모두 지원하는 통합 IWINV 프로바이더
 */
export declare class IWINVMultiProvider {
    private alimtalkProvider;
    private smsProvider;
    private config;
    constructor(config: IWINVConfig);
    get id(): string;
    get name(): string;
    get version(): string;
    get type(): "messaging";
    /**
     * AlimTalk 프로바이더 인스턴스 반환
     */
    getAlimTalkProvider(): IWINVProvider;
    /**
     * SMS 프로바이더 인스턴스 반환
     */
    getSMSProvider(): IWINVSMSProvider;
    /**
     * 채널 타입에 따른 자동 라우팅 전송
     */
    send(request: StandardRequest & {
        channel?: 'alimtalk' | 'sms' | 'auto';
    }): Promise<StandardResult>;
    /**
     * AlimTalk 전송 (템플릿 기반)
     */
    sendAlimTalk(templateCode: string, phoneNumber: string, variables: Record<string, string>, options?: {
        scheduledAt?: Date;
        senderNumber?: string;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<StandardResult>;
    /**
     * SMS 전송 (직접 메시지)
     */
    sendSMS(phoneNumber: string, message: string, options?: {
        senderNumber?: string;
        scheduledAt?: Date;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<StandardResult>;
    /**
     * LMS 전송 (긴 메시지)
     */
    sendLMS(phoneNumber: string, subject: string, message: string, options?: {
        senderNumber?: string;
        scheduledAt?: Date;
        priority?: 'high' | 'normal' | 'low';
    }): Promise<StandardResult>;
    /**
     * 폴백 전송 (AlimTalk 실패 시 SMS로 자동 전환)
     */
    sendWithFallback(request: {
        templateCode: string;
        phoneNumber: string;
        variables: Record<string, string>;
        fallbackMessage?: string;
        options?: {
            scheduledAt?: Date;
            senderNumber?: string;
            priority?: 'high' | 'normal' | 'low';
        };
    }): Promise<StandardResult & {
        channel: 'alimtalk' | 'sms';
    }>;
    /**
     * 대량 전송 (채널 자동 선택)
     */
    sendBulk(requests: Array<StandardRequest & {
        channel?: 'alimtalk' | 'sms' | 'auto';
    }>, options?: {
        batchSize?: number;
        concurrency?: number;
    }): Promise<StandardResult[]>;
    /**
     * 헬스체크 (두 프로바이더 모두 확인)
     */
    healthCheck(): Promise<{
        healthy: boolean;
        issues: string[];
        data: {
            alimtalk: any;
            sms: any;
        };
    }>;
    /**
     * 지원 기능 목록
     */
    getSupportedFeatures(): string[];
    /**
     * 설정 정보
     */
    getCapabilities(): {
        channels: string[];
        maxRecipientsPerRequest: number;
        maxRequestsPerSecond: number;
        supportsBulk: boolean;
        supportsScheduling: boolean;
        supportsTemplating: boolean;
        supportsAutoFallback: boolean;
        supportsWebhooks: boolean;
    };
}
/**
 * Multi Provider 팩토리 함수들
 */
export declare const createIWINVMultiProvider: (config: IWINVConfig) => IWINVMultiProvider;
export declare const createDefaultIWINVMultiProvider: () => IWINVMultiProvider;
