/**
 * IWINV Template Contract Implementation
 */

import {
  type ProviderTemplate,
  type SyncResult,
  type TemplateContract,
  type TemplateCreateRequest,
  type TemplateCreateResult,
  type TemplateFilters,
  TemplateStatus,
  type TemplateUpdateRequest,
  type TemplateUpdateResult,
} from "../../contracts/provider.contract";

import type { IWINVConfig } from "../types/iwinv";

// IWINV 템플릿 API 응답 타입
interface IWINVTemplateResponse {
  code: string;
  message: string;
  template_code?: string;
}

interface IWINVTemplateListResponse {
  code: string;
  message: string;
  list?: Array<{
    template_code: string;
    template_name: string;
    template_content: string;
    template_status: string; // 'APPROVED', 'PENDING', 'REJECTED'
    reg_date: string;
    approve_date?: string;
    reject_reason?: string;
    template_button?: Array<{
      name: string;
      type: string;
      url_mobile?: string;
      url_pc?: string;
      scheme_ios?: string;
      scheme_android?: string;
    }>;
  }>;
}

export class IWINVTemplateContract implements TemplateContract {
  constructor(private config: IWINVConfig) {}

  async create(template: TemplateCreateRequest): Promise<TemplateCreateResult> {
    try {
      // IWINV 실제 템플릿 등록 API
      const response = await fetch(`${this.config.baseUrl}/template/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          AUTH: btoa(this.config.apiKey),
        },
        body: JSON.stringify({
          // IWINV API 필드 매핑
          template_name: template.name,
          template_content: template.content,
          template_button:
            template.buttons?.map((btn) => ({
              name: btn.name,
              type: btn.type,
              url_mobile: btn.linkMobile,
              url_pc: btn.linkPc,
              scheme_ios: btn.schemeIos,
              scheme_android: btn.schemeAndroid,
            })) || [],
          template_category: template.category || "NOTIFICATION",
        }),
      });

      const responseText = await response.text();
      let result: IWINVTemplateResponse;

      try {
        result = JSON.parse(responseText) as IWINVTemplateResponse;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok || result.code !== "0") {
        throw new Error(
          `Template creation failed: ${result.message || "Unknown error"}`,
        );
      }

      return {
        templateId: result.template_code || `tpl_${Date.now()}`,
        providerTemplateCode: result.template_code || template.name,
        status: TemplateStatus.PENDING, // IWINV는 검수 대기 상태
        message: result.message || "Template created and pending approval",
      };
    } catch (error) {
      throw new Error(
        `Failed to create template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async update(
    templateId: string,
    template: TemplateUpdateRequest,
  ): Promise<TemplateUpdateResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/template/modify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          AUTH: btoa(this.config.apiKey),
        },
        body: JSON.stringify({
          templateCode: templateId,
          templateName: template.name,
          templateContent: template.content,
          templateButtons: template.buttons,
        }),
      });

      const result = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(`Template update failed: ${result.message as string}`);
      }

      return {
        templateId,
        status: TemplateStatus.PENDING,
        message: (result.message as string) || "Template updated successfully",
      };
    } catch (error) {
      throw new Error(
        `Failed to update template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async delete(templateId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/template/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          AUTH: btoa(this.config.apiKey),
        },
        body: JSON.stringify({
          templateCode: templateId,
        }),
      });

      const result = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        throw new Error(
          `Template deletion failed: ${result.message as string}`,
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to delete template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async get(templateId: string): Promise<ProviderTemplate> {
    interface IWINVTemplateFilters extends TemplateFilters {
      templateCode?: string;
      templateName?: string;
      templateStatus?: string;
    }
    const templates = await this.list({
      templateCode: templateId,
    } as IWINVTemplateFilters);
    const template = templates.find((t) => t.code === templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return template;
  }

  async list(filters?: TemplateFilters): Promise<ProviderTemplate[]> {
    try {
      // IWINV 실제 템플릿 목록 조회 API
      const response = await fetch(`${this.config.baseUrl}/template/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          AUTH: btoa(this.config.apiKey),
        },
      });

      const responseText = await response.text();
      let result: IWINVTemplateListResponse;

      try {
        result = JSON.parse(responseText) as IWINVTemplateListResponse;
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok || result.code !== "0") {
        throw new Error(
          `Template list failed: ${result.message || "Unknown error"}`,
        );
      }

      const templates = (result.list || []).map((tpl) => ({
        id: tpl.template_code,
        code: tpl.template_code,
        name: tpl.template_name,
        content: tpl.template_content,
        status: this.mapIWINVTemplateStatus(tpl.template_status),
        createdAt: new Date(tpl.reg_date),
        updatedAt: new Date(tpl.reg_date),
        approvedAt: tpl.approve_date ? new Date(tpl.approve_date) : undefined,
        rejectedAt:
          tpl.template_status === "REJECTED"
            ? new Date(tpl.reg_date)
            : undefined,
        rejectionReason: tpl.reject_reason,
      }));

      return this.applyFilters(templates, filters);
    } catch (error) {
      throw new Error(
        `Failed to list templates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async sync(): Promise<SyncResult> {
    try {
      const templates = await this.list();

      return {
        synced: templates.length,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [],
      };
    } catch (error) {
      return {
        synced: 0,
        created: 0,
        updated: 0,
        deleted: 0,
        errors: [
          {
            templateId: "unknown",
            error: error instanceof Error ? error.message : "Sync failed",
          },
        ],
      };
    }
  }

  private mapIWINVTemplateStatus(status: string): TemplateStatus {
    switch (status) {
      case "APPROVED":
        return TemplateStatus.APPROVED;
      case "PENDING":
        return TemplateStatus.PENDING;
      case "REJECTED":
        return TemplateStatus.REJECTED;
      default:
        return TemplateStatus.PENDING;
    }
  }

  private applyFilters(
    templates: ProviderTemplate[],
    filters?: TemplateFilters,
  ): ProviderTemplate[] {
    if (!filters) return templates;

    return templates.filter((template) => {
      if (filters.status && template.status !== filters.status) {
        return false;
      }
      if (
        filters.category &&
        template.content.indexOf(filters.category) === -1
      ) {
        return false;
      }
      if (filters.createdAfter && template.createdAt < filters.createdAfter) {
        return false;
      }
      if (filters.createdBefore && template.createdAt > filters.createdBefore) {
        return false;
      }
      return true;
    });
  }

  // 레거시 지원을 위한 메서드
  private mapIWINVStatus(status: string): TemplateStatus {
    switch (status) {
      case "Y":
        return TemplateStatus.APPROVED;
      case "I":
        return TemplateStatus.PENDING;
      case "R":
        return TemplateStatus.REJECTED;
      case "D":
        return TemplateStatus.DISABLED;
      default:
        return TemplateStatus.DRAFT;
    }
  }
}
