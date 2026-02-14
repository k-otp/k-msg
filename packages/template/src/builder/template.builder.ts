/**
 * Template Builder - Fluent API for creating AlimTalk templates
 */

import { TemplateValidator } from "../parser/validator";
import { VariableParser } from "../parser/variable.parser";
import {
  type AlimTalkTemplate,
  type TemplateButton,
  TemplateCategory,
  TemplateStatus,
  type TemplateVariable,
} from "../types/template.types";

export class TemplateBuilder {
  private template: Partial<AlimTalkTemplate> = {
    variables: [],
    buttons: [],
    status: TemplateStatus.DRAFT,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: { sent: 0, delivered: 0, failed: 0 },
    },
  };

  /**
   * Set template name
   */
  name(name: string): TemplateBuilder {
    this.template.name = name;
    return this;
  }

  /**
   * Set template code (provider specific)
   */
  code(code: string): TemplateBuilder {
    this.template.code = code;
    return this;
  }

  /**
   * Set template content with variables
   */
  content(content: string): TemplateBuilder {
    this.template.content = content;

    // Auto-extract variables from content
    const extractedVariables = VariableParser.extractVariables(content);
    const existingVariableNames = (this.template.variables || []).map(
      (v) => v.name,
    );

    // Add newly found variables as string type by default
    for (const varName of extractedVariables) {
      if (!existingVariableNames.includes(varName)) {
        this.variable(varName, "string", true);
      }
    }

    return this;
  }

  /**
   * Set template category
   */
  category(category: TemplateCategory): TemplateBuilder {
    this.template.category = category;
    return this;
  }

  /**
   * Set template provider
   */
  provider(provider: string): TemplateBuilder {
    this.template.provider = provider;
    return this;
  }

  /**
   * Set template status
   */
  status(status: TemplateStatus): TemplateBuilder {
    this.template.status = status;
    return this;
  }

  /**
   * Add a variable definition
   */
  variable(
    name: string,
    type: "string" | "number" | "date" | "custom" = "string",
    required: boolean = true,
    options: {
      maxLength?: number;
      format?: string;
      description?: string;
      example?: string;
    } = {},
  ): TemplateBuilder {
    if (!this.template.variables) {
      this.template.variables = [];
    }

    // Remove existing variable with same name
    this.template.variables = this.template.variables.filter(
      (v) => v.name !== name,
    );

    const variable: TemplateVariable = {
      name,
      type,
      required,
      ...options,
    };

    this.template.variables.push(variable);
    return this;
  }

  /**
   * Add multiple variables at once
   */
  variables(
    variables: Array<{
      name: string;
      type?: "string" | "number" | "date" | "custom";
      required?: boolean;
      maxLength?: number;
      format?: string;
      description?: string;
      example?: string;
    }>,
  ): TemplateBuilder {
    for (const variable of variables) {
      this.variable(
        variable.name,
        variable.type || "string",
        variable.required ?? true,
        {
          maxLength: variable.maxLength,
          format: variable.format,
          description: variable.description,
          example: variable.example,
        },
      );
    }
    return this;
  }

  /**
   * Add a web link button
   */
  webLinkButton(
    name: string,
    mobileUrl?: string,
    pcUrl?: string,
  ): TemplateBuilder {
    return this.button({
      type: "WL",
      name,
      linkMobile: mobileUrl,
      linkPc: pcUrl,
    });
  }

  /**
   * Add an app link button
   */
  appLinkButton(
    name: string,
    options: {
      iosUrl?: string;
      androidUrl?: string;
      iosScheme?: string;
      androidScheme?: string;
    },
  ): TemplateBuilder {
    return this.button({
      type: "AL",
      name,
      linkIos: options.iosUrl,
      linkAndroid: options.androidUrl,
      schemeIos: options.iosScheme,
      schemeAndroid: options.androidScheme,
    });
  }

  /**
   * Add a delivery tracking button
   */
  deliveryButton(name: string): TemplateBuilder {
    return this.button({
      type: "DS",
      name,
    });
  }

  /**
   * Add a bot keyword button
   */
  botKeywordButton(name: string): TemplateBuilder {
    return this.button({
      type: "BK",
      name,
    });
  }

  /**
   * Add a message delivery button
   */
  messageDeliveryButton(name: string): TemplateBuilder {
    return this.button({
      type: "MD",
      name,
    });
  }

  /**
   * Add a custom button
   */
  button(button: TemplateButton): TemplateBuilder {
    if (!this.template.buttons) {
      this.template.buttons = [];
    }

    if (this.template.buttons.length >= 5) {
      throw new Error("Maximum 5 buttons are allowed per template");
    }

    this.template.buttons.push(button);
    return this;
  }

  /**
   * Clear all buttons
   */
  clearButtons(): TemplateBuilder {
    this.template.buttons = [];
    return this;
  }

  /**
   * Set template metadata
   */
  metadata(metadata: Partial<AlimTalkTemplate["metadata"]>): TemplateBuilder {
    this.template.metadata = {
      ...this.template.metadata!,
      ...metadata,
      updatedAt: new Date(),
    };
    return this;
  }

  /**
   * Validate the current template
   */
  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    // Quick validation for required fields
    const quickValidation = TemplateValidator.quickValidate(this.template);
    if (!quickValidation.isValid) {
      return quickValidation;
    }

    // Full validation if template is complete enough
    try {
      const fullTemplate = this.build();
      return TemplateValidator.validate(fullTemplate);
    } catch (error) {
      return {
        isValid: false,
        errors: [
          error instanceof Error ? error.message : "Unknown validation error",
        ],
        warnings: [],
      };
    }
  }

  /**
   * Preview the template with sample variables
   */
  preview(sampleVariables: Record<string, any> = {}): string {
    if (!this.template.content) {
      throw new Error("Template content is required for preview");
    }

    // Use provided sample variables or generate defaults
    const variables = { ...this.generateSampleVariables(), ...sampleVariables };

    return VariableParser.replaceVariables(this.template.content, variables);
  }

  /**
   * Generate sample variables based on variable definitions
   */
  private generateSampleVariables(): Record<string, any> {
    const samples: Record<string, any> = {};

    for (const variable of this.template.variables || []) {
      if (variable.example) {
        samples[variable.name] = variable.example;
      } else {
        // Generate default sample based on type
        switch (variable.type) {
          case "string":
            samples[variable.name] =
              variable.name.includes("name") || variable.name.includes("이름")
                ? "홍길동"
                : variable.name.includes("code") ||
                    variable.name.includes("코드")
                  ? "123456"
                  : `샘플${variable.name}`;
            break;
          case "number":
            samples[variable.name] =
              variable.name.includes("amount") || variable.name.includes("금액")
                ? 10000
                : variable.name.includes("count") ||
                    variable.name.includes("개수")
                  ? 1
                  : 123;
            break;
          case "date":
            samples[variable.name] = new Date();
            break;
          default:
            samples[variable.name] = `샘플값`;
        }
      }
    }

    return samples;
  }

  /**
   * Clone the current builder
   */
  clone(): TemplateBuilder {
    const cloned = new TemplateBuilder();
    cloned.template = JSON.parse(JSON.stringify(this.template));
    return cloned;
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): TemplateBuilder {
    this.template = {
      variables: [],
      buttons: [],
      status: TemplateStatus.DRAFT,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: { sent: 0, delivered: 0, failed: 0 },
      },
    };
    return this;
  }

  /**
   * Build the final template
   */
  build(): AlimTalkTemplate {
    // Validate required fields
    if (!this.template.name) throw new Error("Template name is required");
    if (!this.template.code) throw new Error("Template code is required");
    if (!this.template.content) throw new Error("Template content is required");
    if (!this.template.category)
      throw new Error("Template category is required");
    if (!this.template.provider)
      throw new Error("Template provider is required");

    const template: AlimTalkTemplate = {
      id: this.template.id || this.generateTemplateId(),
      name: this.template.name,
      code: this.template.code,
      content: this.template.content,
      variables: this.template.variables || [],
      buttons: this.template.buttons,
      category: this.template.category,
      status: this.template.status || TemplateStatus.DRAFT,
      provider: this.template.provider,
      metadata: {
        ...this.template.metadata!,
        updatedAt: new Date(),
      },
    };

    // Final validation
    const validation = TemplateValidator.validate(template);
    if (!validation.isValid) {
      throw new Error(
        `Template validation failed: ${validation.errors.join(", ")}`,
      );
    }

    return template;
  }

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Static factory methods for common template types
 */
export const TemplateBuilders = {
  /**
   * Create an authentication template builder
   */
  authentication(name: string, provider: string): TemplateBuilder {
    return new TemplateBuilder()
      .name(name)
      .category(TemplateCategory.AUTHENTICATION)
      .provider(provider)
      .variable("code", "string", true, {
        maxLength: 10,
        description: "Authentication code",
        example: "123456",
      });
  },

  /**
   * Create a notification template builder
   */
  notification(name: string, provider: string): TemplateBuilder {
    return new TemplateBuilder()
      .name(name)
      .category(TemplateCategory.NOTIFICATION)
      .provider(provider)
      .variable("name", "string", true, {
        description: "Recipient name",
        example: "홍길동",
      });
  },

  /**
   * Create a promotion template builder
   */
  promotion(name: string, provider: string): TemplateBuilder {
    return new TemplateBuilder()
      .name(name)
      .category(TemplateCategory.PROMOTION)
      .provider(provider)
      .variable("name", "string", true, {
        description: "Customer name",
        example: "홍길동",
      })
      .variable("discount", "number", false, {
        description: "Discount percentage",
        example: "20",
      });
  },

  /**
   * Create a payment template builder
   */
  payment(name: string, provider: string): TemplateBuilder {
    return new TemplateBuilder()
      .name(name)
      .category(TemplateCategory.PAYMENT)
      .provider(provider)
      .variable("name", "string", true, {
        description: "Customer name",
        example: "홍길동",
      })
      .variable("amount", "number", true, {
        description: "Payment amount",
        example: "10000",
      });
  },
};
