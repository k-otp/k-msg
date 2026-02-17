/**
 * Template Registry - Manages templates across providers and categories
 */

import { EventEmitter } from "../shared/event-emitter";
import { TemplateValidator } from "../parser/validator";
import type {
  AlimTalkTemplate,
  TemplateCategory,
  TemplateStatus,
} from "../types/template.types";

export interface TemplateSearchFilters {
  provider?: string;
  category?: TemplateCategory;
  status?: TemplateStatus;
  nameContains?: string;
  codeContains?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  usageMin?: number;
  usageMax?: number;
}

export interface TemplateSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: "name" | "code" | "createdAt" | "updatedAt" | "usage";
  sortOrder?: "asc" | "desc";
}

export interface TemplateSearchResult {
  templates: AlimTalkTemplate[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TemplateVersion {
  version: number;
  template: AlimTalkTemplate;
  changes: string[];
  createdAt: Date;
  createdBy?: string;
}

export interface TemplateHistory {
  templateId: string;
  versions: TemplateVersion[];
  currentVersion: number;
}

export interface TemplateUsageStats {
  templateId: string;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  failureRate: number;
  lastUsed?: Date;
  usageByDay: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export interface TemplateRegistryOptions {
  enableVersioning: boolean;
  maxVersionsPerTemplate: number;
  enableUsageTracking: boolean;
  enableAutoBackup: boolean;
  backupInterval: number; // in milliseconds
  enableValidationOnRegister: boolean;
}

export class TemplateRegistry extends EventEmitter {
  private templates = new Map<string, AlimTalkTemplate>();
  private templatesByCode = new Map<string, AlimTalkTemplate>();
  private templatesByProvider = new Map<string, Set<string>>();
  private templatesByCategory = new Map<TemplateCategory, Set<string>>();
  private templateHistories = new Map<string, TemplateHistory>();
  private usageStats = new Map<string, TemplateUsageStats>();
  private backupTimer?: ReturnType<typeof setInterval>;

  private defaultOptions: TemplateRegistryOptions = {
    enableVersioning: true,
    maxVersionsPerTemplate: 10,
    enableUsageTracking: true,
    enableAutoBackup: false,
    backupInterval: 3600000, // 1 hour
    enableValidationOnRegister: true,
  };

  constructor(private options: Partial<TemplateRegistryOptions> = {}) {
    super();
    this.options = { ...this.defaultOptions, ...options };

    if (this.options.enableAutoBackup) {
      this.startAutoBackup();
    }
  }

  /**
   * Register a new template
   */
  async register(template: AlimTalkTemplate): Promise<void> {
    // Validate template if enabled
    if (this.options.enableValidationOnRegister) {
      const validation = TemplateValidator.validate(template);
      if (!validation.isValid) {
        throw new Error(
          `Template validation failed: ${validation.errors.join(", ")}`,
        );
      }
    }

    // Check for duplicate codes within the same provider
    const existingTemplate = this.getByCode(template.code, template.provider);
    if (existingTemplate && existingTemplate.id !== template.id) {
      throw new Error(
        `Template with code '${template.code}' already exists for provider '${template.provider}'`,
      );
    }

    // Store the template
    this.templates.set(template.id, template);
    this.templatesByCode.set(`${template.provider}:${template.code}`, template);

    // Update indexes
    this.updateIndexes(template);

    // Initialize version history if enabled
    if (this.options.enableVersioning) {
      this.initializeVersionHistory(template);
    }

    // Initialize usage tracking if enabled
    if (this.options.enableUsageTracking) {
      this.initializeUsageStats(template);
    }

    this.emit("template:registered", { template });
  }

  /**
   * Update an existing template
   */
  async update(
    templateId: string,
    updates: Partial<AlimTalkTemplate>,
  ): Promise<AlimTalkTemplate> {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Create updated template
    const updatedTemplate: AlimTalkTemplate = {
      ...existing,
      ...updates,
      id: templateId, // Ensure ID doesn't change
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };

    // Validate if enabled
    if (this.options.enableValidationOnRegister) {
      const validation = TemplateValidator.validate(updatedTemplate);
      if (!validation.isValid) {
        throw new Error(
          `Template validation failed: ${validation.errors.join(", ")}`,
        );
      }
    }

    // Update version history if enabled
    if (this.options.enableVersioning) {
      this.addVersionToHistory(existing, updatedTemplate);
    }

    // Update storage and indexes
    this.templates.set(templateId, updatedTemplate);
    this.templatesByCode.set(
      `${updatedTemplate.provider}:${updatedTemplate.code}`,
      updatedTemplate,
    );
    this.updateIndexes(updatedTemplate);

    this.emit("template:updated", {
      oldTemplate: existing,
      newTemplate: updatedTemplate,
    });

    return updatedTemplate;
  }

  /**
   * Get template by ID
   */
  get(templateId: string): AlimTalkTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get template by code and provider
   */
  getByCode(code: string, provider: string): AlimTalkTemplate | null {
    return this.templatesByCode.get(`${provider}:${code}`) || null;
  }

  /**
   * Search templates with filters and pagination
   */
  search(
    filters: TemplateSearchFilters = {},
    options: TemplateSearchOptions = {},
  ): TemplateSearchResult {
    let templates = Array.from(this.templates.values());

    // Apply filters
    if (filters.provider) {
      templates = templates.filter((t) => t.provider === filters.provider);
    }

    if (filters.category) {
      templates = templates.filter((t) => t.category === filters.category);
    }

    if (filters.status) {
      templates = templates.filter((t) => t.status === filters.status);
    }

    if (filters.nameContains) {
      const searchTerm = filters.nameContains.toLowerCase();
      templates = templates.filter((t) =>
        t.name.toLowerCase().includes(searchTerm),
      );
    }

    if (filters.codeContains) {
      const searchTerm = filters.codeContains.toLowerCase();
      templates = templates.filter((t) =>
        t.code.toLowerCase().includes(searchTerm),
      );
    }

    if (filters.createdAfter) {
      templates = templates.filter(
        (t) => t.metadata.createdAt >= filters.createdAfter!,
      );
    }

    if (filters.createdBefore) {
      templates = templates.filter(
        (t) => t.metadata.createdAt <= filters.createdBefore!,
      );
    }

    if (filters.usageMin !== undefined) {
      templates = templates.filter(
        (t) => t.metadata.usage.sent >= filters.usageMin!,
      );
    }

    if (filters.usageMax !== undefined) {
      templates = templates.filter(
        (t) => t.metadata.usage.sent <= filters.usageMax!,
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    templates.sort((a, b) => {
      let aValue: string | number = 0;
      let bValue: string | number = 0;

      switch (sortBy) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "code":
          aValue = a.code;
          bValue = b.code;
          break;
        case "createdAt":
          aValue = a.metadata.createdAt.getTime();
          bValue = b.metadata.createdAt.getTime();
          break;
        case "updatedAt":
          aValue = a.metadata.updatedAt.getTime();
          bValue = b.metadata.updatedAt.getTime();
          break;
        case "usage":
          aValue = a.metadata.usage.sent;
          bValue = b.metadata.usage.sent;
          break;
        default:
          aValue = a.metadata.createdAt.getTime();
          bValue = b.metadata.createdAt.getTime();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedTemplates = templates.slice(start, end);

    return {
      templates: paginatedTemplates,
      total: templates.length,
      page,
      limit,
      hasMore: end < templates.length,
    };
  }

  /**
   * Get templates by provider
   */
  getByProvider(provider: string): AlimTalkTemplate[] {
    const templateIds = this.templatesByProvider.get(provider) || new Set();
    return Array.from(templateIds)
      .map((id) => this.templates.get(id))
      .filter(
        (template): template is AlimTalkTemplate => template !== undefined,
      );
  }

  /**
   * Get templates by category
   */
  getByCategory(category: TemplateCategory): AlimTalkTemplate[] {
    const templateIds = this.templatesByCategory.get(category) || new Set();
    return Array.from(templateIds)
      .map((id) => this.templates.get(id))
      .filter(
        (template): template is AlimTalkTemplate => template !== undefined,
      );
  }

  /**
   * Delete template
   */
  async delete(templateId: string): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      return false;
    }

    // Remove from all indexes
    this.templates.delete(templateId);
    this.templatesByCode.delete(`${template.provider}:${template.code}`);

    const providerSet = this.templatesByProvider.get(template.provider);
    if (providerSet) {
      providerSet.delete(templateId);
      if (providerSet.size === 0) {
        this.templatesByProvider.delete(template.provider);
      }
    }

    const categorySet = this.templatesByCategory.get(template.category);
    if (categorySet) {
      categorySet.delete(templateId);
      if (categorySet.size === 0) {
        this.templatesByCategory.delete(template.category);
      }
    }

    // Clean up version history and usage stats
    this.templateHistories.delete(templateId);
    this.usageStats.delete(templateId);

    this.emit("template:deleted", { template });
    return true;
  }

  /**
   * Get template version history
   */
  getHistory(templateId: string): TemplateHistory | null {
    return this.templateHistories.get(templateId) || null;
  }

  /**
   * Get specific template version
   */
  getVersion(templateId: string, version: number): AlimTalkTemplate | null {
    const history = this.templateHistories.get(templateId);
    if (!history) return null;

    const versionEntry = history.versions.find((v) => v.version === version);
    return versionEntry ? versionEntry.template : null;
  }

  /**
   * Restore template to a specific version
   */
  async restoreVersion(
    templateId: string,
    version: number,
  ): Promise<AlimTalkTemplate> {
    const versionTemplate = this.getVersion(templateId, version);
    if (!versionTemplate) {
      throw new Error(
        `Version ${version} not found for template ${templateId}`,
      );
    }

    // Update to the version template (this will create a new version)
    return this.update(templateId, {
      ...versionTemplate,
      metadata: {
        ...versionTemplate.metadata,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get template usage statistics
   */
  getUsageStats(templateId: string): TemplateUsageStats | null {
    return this.usageStats.get(templateId) || null;
  }

  /**
   * Update template usage statistics
   */
  updateUsageStats(
    templateId: string,
    stats: {
      sent?: number;
      delivered?: number;
      failed?: number;
    },
  ): void {
    const template = this.templates.get(templateId);
    if (!template) return;

    // Update template metadata
    if (stats.sent) template.metadata.usage.sent += stats.sent;
    if (stats.delivered) template.metadata.usage.delivered += stats.delivered;
    if (stats.failed) template.metadata.usage.failed += stats.failed;

    // Update usage stats if tracking is enabled
    if (this.options.enableUsageTracking) {
      const usageStats = this.usageStats.get(templateId);
      if (usageStats) {
        if (stats.sent) usageStats.totalSent += stats.sent;
        if (stats.delivered) usageStats.totalDelivered += stats.delivered;
        if (stats.failed) usageStats.totalFailed += stats.failed;

        usageStats.deliveryRate =
          usageStats.totalSent > 0
            ? (usageStats.totalDelivered / usageStats.totalSent) * 100
            : 0;
        usageStats.failureRate =
          usageStats.totalSent > 0
            ? (usageStats.totalFailed / usageStats.totalSent) * 100
            : 0;
        usageStats.lastUsed = new Date();

        // Update daily stats
        const today = new Date().toISOString().split("T")[0];
        let todayStats = usageStats.usageByDay.find((d) => d.date === today);

        if (!todayStats) {
          todayStats = { date: today, sent: 0, delivered: 0, failed: 0 };
          usageStats.usageByDay.push(todayStats);

          // Keep only last 30 days
          usageStats.usageByDay = usageStats.usageByDay
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30);
        }

        if (stats.sent) todayStats.sent += stats.sent;
        if (stats.delivered) todayStats.delivered += stats.delivered;
        if (stats.failed) todayStats.failed += stats.failed;
      }
    }

    this.emit("usage:updated", { templateId, stats });
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalTemplates: number;
    byProvider: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const templates = Array.from(this.templates.values());

    const byProvider: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const template of templates) {
      byProvider[template.provider] = (byProvider[template.provider] || 0) + 1;
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      byStatus[template.status] = (byStatus[template.status] || 0) + 1;
    }

    return {
      totalTemplates: templates.length,
      byProvider,
      byCategory,
      byStatus,
    };
  }

  /**
   * Export templates to JSON
   */
  export(filters?: TemplateSearchFilters): string {
    const result = this.search(filters, { limit: 10000 });
    return JSON.stringify(
      {
        templates: result.templates,
        exportedAt: new Date().toISOString(),
        total: result.total,
      },
      null,
      2,
    );
  }

  /**
   * Import templates from JSON
   */
  async import(
    jsonData: string,
    options: { overwrite?: boolean } = {},
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const data = JSON.parse(jsonData);
      const templates = data.templates || [];

      for (const templateData of templates) {
        try {
          const existingTemplate = this.get(templateData.id);

          if (existingTemplate && !options.overwrite) {
            result.skipped++;
            continue;
          }

          await this.register(templateData);
          result.imported++;
        } catch (error) {
          result.errors.push(
            `Template ${templateData.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Invalid JSON format: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }

  /**
   * Clear all templates (use with caution!)
   */
  clear(): void {
    this.templates.clear();
    this.templatesByCode.clear();
    this.templatesByProvider.clear();
    this.templatesByCategory.clear();
    this.templateHistories.clear();
    this.usageStats.clear();

    this.emit("registry:cleared");
  }

  /**
   * Stop the registry and cleanup
   */
  destroy(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
    }

    this.removeAllListeners();
    this.emit("registry:destroyed");
  }

  private updateIndexes(template: AlimTalkTemplate): void {
    // Update provider index
    if (!this.templatesByProvider.has(template.provider)) {
      this.templatesByProvider.set(template.provider, new Set());
    }
    this.templatesByProvider.get(template.provider)!.add(template.id);

    // Update category index
    if (!this.templatesByCategory.has(template.category)) {
      this.templatesByCategory.set(template.category, new Set());
    }
    this.templatesByCategory.get(template.category)!.add(template.id);
  }

  private initializeVersionHistory(template: AlimTalkTemplate): void {
    const history: TemplateHistory = {
      templateId: template.id,
      versions: [
        {
          version: 1,
          template: JSON.parse(JSON.stringify(template)),
          changes: ["Initial version"],
          createdAt: new Date(),
        },
      ],
      currentVersion: 1,
    };

    this.templateHistories.set(template.id, history);
  }

  private addVersionToHistory(
    oldTemplate: AlimTalkTemplate,
    newTemplate: AlimTalkTemplate,
  ): void {
    const history = this.templateHistories.get(newTemplate.id);
    if (!history) return;

    // Detect changes
    const changes: string[] = [];
    if (oldTemplate.name !== newTemplate.name) changes.push("Name changed");
    if (oldTemplate.content !== newTemplate.content)
      changes.push("Content changed");
    if (oldTemplate.category !== newTemplate.category)
      changes.push("Category changed");
    if (oldTemplate.status !== newTemplate.status)
      changes.push("Status changed");
    if (
      JSON.stringify(oldTemplate.variables) !==
      JSON.stringify(newTemplate.variables)
    ) {
      changes.push("Variables changed");
    }
    if (
      JSON.stringify(oldTemplate.buttons) !==
      JSON.stringify(newTemplate.buttons)
    ) {
      changes.push("Buttons changed");
    }

    if (changes.length === 0) return; // No changes detected

    const newVersion: TemplateVersion = {
      version: history.currentVersion + 1,
      template: JSON.parse(JSON.stringify(newTemplate)),
      changes,
      createdAt: new Date(),
    };

    history.versions.push(newVersion);
    history.currentVersion = newVersion.version;

    // Keep only max versions
    if (history.versions.length > this.options.maxVersionsPerTemplate!) {
      history.versions = history.versions.slice(
        -this.options.maxVersionsPerTemplate!,
      );
    }
  }

  private initializeUsageStats(template: AlimTalkTemplate): void {
    const stats: TemplateUsageStats = {
      templateId: template.id,
      totalSent: template.metadata.usage.sent,
      totalDelivered: template.metadata.usage.delivered,
      totalFailed: template.metadata.usage.failed,
      deliveryRate: 0,
      failureRate: 0,
      usageByDay: [],
    };

    if (stats.totalSent > 0) {
      stats.deliveryRate = (stats.totalDelivered / stats.totalSent) * 100;
      stats.failureRate = (stats.totalFailed / stats.totalSent) * 100;
    }

    this.usageStats.set(template.id, stats);
  }

  private startAutoBackup(): void {
    this.backupTimer = setInterval(() => {
      this.emit("backup:requested", {
        data: this.export(),
        timestamp: new Date(),
      });
    }, this.options.backupInterval!);
  }
}
