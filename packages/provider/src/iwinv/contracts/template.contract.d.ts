/**
 * IWINV Template Contract Implementation
 */
import { TemplateContract, TemplateCreateRequest, TemplateUpdateRequest, TemplateCreateResult, TemplateUpdateResult, ProviderTemplate, TemplateFilters, SyncResult } from '../../contracts/provider.contract';
import { IWINVConfig } from '../types/iwinv';
export declare class IWINVTemplateContract implements TemplateContract {
    private config;
    constructor(config: IWINVConfig);
    create(template: TemplateCreateRequest): Promise<TemplateCreateResult>;
    update(templateId: string, template: TemplateUpdateRequest): Promise<TemplateUpdateResult>;
    delete(templateId: string): Promise<void>;
    get(templateId: string): Promise<ProviderTemplate>;
    list(filters?: TemplateFilters): Promise<ProviderTemplate[]>;
    sync(): Promise<SyncResult>;
    private mapIWINVStatus;
}
//# sourceMappingURL=template.contract.d.ts.map