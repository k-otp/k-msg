import { TemplateValidator } from "../parser/validator";
import { VariableParser } from "../parser/variable.parser";
import type { AlimTalkTemplate } from "../types/template.types";

export class InMemoryTemplateStore {
  private templates: Map<string, AlimTalkTemplate> = new Map();

  async createTemplate(
    template: Omit<AlimTalkTemplate, "id" | "metadata">,
  ): Promise<AlimTalkTemplate> {
    const variables = VariableParser.extractVariables(template.content);

    const newTemplate: AlimTalkTemplate = {
      ...template,
      id: this.generateTemplateId(),
      variables: variables.map((name) => ({
        name,
        type: "string",
        required: true,
      })),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { sent: 0, delivered: 0, failed: 0 },
      },
    };

    const validation = TemplateValidator.validate(newTemplate);
    if (!validation.isValid) {
      throw new Error(
        `Template validation failed: ${validation.errors.join(", ")}`,
      );
    }

    this.templates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  async getTemplate(templateId: string): Promise<AlimTalkTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<AlimTalkTemplate>,
  ): Promise<AlimTalkTemplate> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        updatedAt: new Date(),
      },
    };

    this.templates.set(templateId, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId);
  }

  async renderTemplate(
    templateId: string,
    variables: Record<string, string | number | Date>,
  ): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const validation = VariableParser.validateVariables(
      template.variables || [],
      variables,
    );
    if (!validation.isValid) {
      throw new Error(
        `Variable validation failed: ${validation.errors.join(", ")}`,
      );
    }

    return VariableParser.replaceVariables(template.content, variables);
  }

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
