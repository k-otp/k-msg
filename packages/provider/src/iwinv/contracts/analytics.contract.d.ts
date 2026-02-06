/**
 * IWINV Analytics Contract Implementation
 */
import { AnalyticsContract, DateRange, UsageStats, TemplateStats, DeliveryReport } from '../../contracts/provider.contract';
import { IWINVConfig } from '../types/iwinv';
export declare class IWINVAnalyticsContract implements AnalyticsContract {
    private config;
    constructor(config: IWINVConfig);
    getUsage(period: DateRange): Promise<UsageStats>;
    getTemplateStats(templateId: string, period: DateRange): Promise<TemplateStats>;
    getDeliveryReport(messageId: string): Promise<DeliveryReport>;
    private groupByTemplate;
    private groupByDay;
    private groupByHour;
    private mapStatus;
}
//# sourceMappingURL=analytics.contract.d.ts.map