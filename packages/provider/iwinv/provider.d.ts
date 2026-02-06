/**
 * IWINV Provider - New Adapter Pattern Implementation
 * 새 어댑터 패턴을 사용한 IWINV 프로바이더 구현
 */
import { BaseProvider, StandardRequest, StandardResult } from '@k-msg/core';
import type { IWINVConfig } from './types/iwinv';
/**
 * 새 어댑터 패턴을 사용한 IWINV 프로바이더 팩토리
 */
export declare class IWINVProviderFactory {
    private static instance;
    private initialized;
    static getInstance(): IWINVProviderFactory;
    private constructor();
    /**
     * 글로벌 레지스트리에 IWINV 어댑터 팩토리 등록
     */
    initialize(): void;
    /**
     * IWINV 프로바이더 인스턴스 생성
     */
    createProvider(config: IWINVConfig): BaseProvider<StandardRequest, StandardResult>;
    /**
     * 설정이 포함된 즉시 사용 가능한 프로바이더 생성
     */
    static create(config: IWINVConfig): BaseProvider<StandardRequest, StandardResult>;
    /**
     * 환경변수를 사용한 기본 프로바이더 생성
     */
    static createDefault(): BaseProvider<StandardRequest, StandardResult>;
}
/**
 * 레거시 호환성을 위한 IWINVProvider 클래스
 * @deprecated Use IWINVProviderFactory.create() instead
 */
export declare class IWINVProvider {
    private provider;
    constructor(config: IWINVConfig);
    get id(): string;
    get name(): string;
    get type(): any;
    get version(): string;
    configure(config: Record<string, unknown>): void;
    isReady(): boolean;
    healthCheck(): Promise<any>;
    destroy(): void;
    send<T extends StandardRequest = StandardRequest, R extends StandardResult = StandardResult>(request: T): Promise<R>;
    getStatus(requestId: string): Promise<any>;
    cancel(requestId: string): Promise<boolean>;
    getCapabilities(): any;
    getSupportedFeatures(): string[];
    getConfigurationSchema(): any;
    getMetadata(): any;
    getAdapter(): any;
}
/**
 * 편의 함수들
 */
export declare const createIWINVProvider: (config: IWINVConfig) => any;
export declare const createDefaultIWINVProvider: () => any;
/**
 * 글로벌 초기화 함수
 */
export declare function initializeIWINV(): void;
