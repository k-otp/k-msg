export * from './base-plugin';
export declare function normalizePhoneNumber(phone: string): string;
export declare function validatePhoneNumber(phone: string): boolean;
export declare function formatDateTime(date: Date): string;
export declare function parseTemplate(template: string, variables: Record<string, string>): string;
export declare function extractVariables(template: string): string[];
export declare function delay(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, options: {
    maxRetries: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
}): Promise<T>;
//# sourceMappingURL=index.d.ts.map