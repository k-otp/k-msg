/**
 * Test utilities for K-Message Platform
 */
import type { BaseProvider, ProviderHealthStatus, PlatformHealthStatus } from './index';
import { KMessageError, KMessageErrorCode } from './errors';
/**
 * Mock provider for testing
 */
export declare class MockProvider implements BaseProvider {
    readonly id: string;
    readonly name: string;
    private _healthy;
    private _issues;
    private _balance;
    private _templates;
    private _history;
    constructor(id?: string, name?: string);
    healthCheck(): Promise<ProviderHealthStatus>;
    setHealthy(healthy: boolean, issues?: string[]): void;
    setBalance(balance: string): void;
    setTemplates(templates: any[]): void;
    setHistory(history: any[]): void;
    sendMessage(templateCode: string, phoneNumber: string, variables: Record<string, any>, options?: any): Promise<{
        success: boolean;
        messageId: string;
        status: string;
        error: null;
    }>;
    getTemplates(page?: number, size?: number, filters?: any): Promise<{
        code: number;
        message: string;
        totalCount: number;
        list: any[];
    }>;
    createTemplate(name: string, content: string, category?: string, buttons?: any[]): Promise<{
        success: boolean;
        templateCode: string;
        status: string;
        error: null;
    }>;
    modifyTemplate(templateCode: string, name: string, content: string, buttons?: any[]): Promise<{
        success: boolean;
        templateCode: string;
        status: string;
        error: null;
    }>;
    deleteTemplate(templateCode: string): Promise<{
        code: number;
        message: string;
    }>;
    getHistory(page?: number, size?: number, filters?: any): Promise<{
        code: number;
        message: string;
        totalCount: number;
        list: any[];
    }>;
    cancelReservation(messageId: string): Promise<{
        code: number;
        message: string;
    }>;
}
/**
 * Test assertion helpers
 */
export declare const TestAssertions: {
    /**
     * Assert that an error is a KMessageError with specific code
     */
    assertKMessageError: (error: unknown, expectedCode: KMessageErrorCode, expectedMessage?: string) => void;
    /**
     * Assert that an error is retryable
     */
    assertRetryable: (error: KMessageError, expected?: boolean) => void;
    /**
     * Assert that a health status is healthy
     */
    assertHealthy: (health: ProviderHealthStatus | PlatformHealthStatus, expected?: boolean) => void;
    /**
     * Assert that a provider result has expected structure
     */
    assertProviderResult: (result: any, expectSuccess?: boolean) => void;
    /**
     * Assert that API response has expected structure
     */
    assertApiResponse: (response: any, expectedCode?: number) => void;
};
/**
 * Test data generators
 */
export declare const TestData: {
    createMockTemplate: (overrides?: Partial<any>) => {
        templateCode: string;
        templateName: string;
        templateContent: string;
        status: string;
        createDate: string;
    };
    createMockMessage: (overrides?: Partial<any>) => {
        seqNo: number;
        phone: string;
        templateCode: string;
        statusCode: string;
        statusCodeName: string;
        requestDate: string;
        sendDate: string;
        receiveDate: string;
        sendMessage: string;
    };
    createMockVariables: (overrides?: Record<string, any>) => {
        서비스명: string;
        고객명: string;
        인증코드: string;
    };
    generatePhoneNumber: (valid?: boolean) => string;
};
/**
 * Test environment setup helpers
 */
export declare const TestSetup: {
    /**
     * Create a test environment with mock providers
     */
    createTestEnvironment: () => {
        providers: {
            healthy: MockProvider;
            unhealthy: MockProvider;
            rateLimited: MockProvider;
        };
        cleanup: () => void;
    };
    /**
     * Create test data for various scenarios
     */
    createTestScenarios: () => {
        validMessage: {
            templateCode: string;
            phoneNumber: string;
            variables: {
                서비스명: string;
                고객명: string;
                인증코드: string;
            };
        };
        invalidMessage: {
            templateCode: string;
            phoneNumber: string;
            variables: {};
        };
        templates: {
            templateCode: string;
            templateName: string;
            templateContent: string;
            status: string;
            createDate: string;
        }[];
        history: {
            seqNo: number;
            phone: string;
            templateCode: string;
            statusCode: string;
            statusCodeName: string;
            requestDate: string;
            sendDate: string;
            receiveDate: string;
            sendMessage: string;
        }[];
    };
};
/**
 * Performance testing helpers
 */
export declare const PerformanceTest: {
    /**
     * Measure execution time of a function
     */
    measureTime: <T>(fn: () => Promise<T>) => Promise<{
        result: T;
        duration: number;
    }>;
    /**
     * Run a function multiple times and get statistics
     */
    benchmark: <T>(fn: () => Promise<T>, iterations?: number) => Promise<{
        results: T[];
        statistics: {
            min: number;
            max: number;
            average: number;
            median: number;
        };
    }>;
};
//# sourceMappingURL=test-utils.d.ts.map