import {
  type AlimTalkTemplate,
  TemplateCategory,
} from "../types/template.types";
import { ButtonParser } from "./button.parser";
import { VariableParser } from "./variable.parser";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TemplateValidator {
  /**
   * 알림톡 템플릿의 전체적인 유효성을 검증합니다
   */
  static validate(template: AlimTalkTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 기본 필드 검증
    TemplateValidator.validateBasicFields(template, errors);

    // 내용 검증
    TemplateValidator.validateContent(template, errors, warnings);

    // 변수 검증
    const variableValidation = VariableParser.validateTemplateVariables(
      template.content,
      template.variables || [],
    );
    errors.push(...variableValidation.errors);

    // 버튼 검증
    if (template.buttons && template.buttons.length > 0) {
      const buttonValidation = ButtonParser.validateButtons(template.buttons);
      errors.push(...buttonValidation.errors);
    }

    // 카테고리별 특수 검증
    TemplateValidator.validateByCategory(template, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateBasicFields(
    template: AlimTalkTemplate,
    errors: string[],
  ): void {
    if (!template.name || template.name.trim().length === 0) {
      errors.push("Template name is required");
    }

    if (!template.code || template.code.trim().length === 0) {
      errors.push("Template code is required");
    }

    if (!template.provider || template.provider.trim().length === 0) {
      errors.push("Provider is required");
    }
  }

  private static validateContent(
    template: AlimTalkTemplate,
    errors: string[],
    warnings: string[],
  ): void {
    if (!template.content || template.content.trim().length === 0) {
      errors.push("Template content is required");
      return;
    }

    const content = template.content;

    // 길이 검증 (카카오 알림톡 제한)
    if (content.length > 1000) {
      errors.push("Template content cannot exceed 1000 characters");
    }

    // 특수 문자 검증
    if (TemplateValidator.containsProhibitedCharacters(content)) {
      errors.push("Template content contains prohibited characters");
    }

    // 줄바꿈 검증 (너무 많은 줄바꿈)
    const lineBreaks = (content.match(/\n/g) || []).length;
    if (lineBreaks > 20) {
      warnings.push(
        "Template content has many line breaks, which may affect readability",
      );
    }

    // URL 검증
    TemplateValidator.validateUrlsInContent(content, warnings);
  }

  private static containsProhibitedCharacters(content: string): boolean {
    // 카카오에서 금지하는 특수 문자들 (예시)
    const prohibitedChars = /[<>]/;
    return prohibitedChars.test(content);
  }

  private static validateUrlsInContent(
    content: string,
    warnings: string[],
  ): void {
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];

    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        warnings.push(`Invalid URL found in content: ${url}`);
      }
    }
  }

  private static validateByCategory(
    template: AlimTalkTemplate,
    errors: string[],
    warnings: string[],
  ): void {
    switch (template.category) {
      case TemplateCategory.AUTHENTICATION:
        TemplateValidator.validateAuthenticationTemplate(
          template,
          errors,
          warnings,
        );
        break;
      case TemplateCategory.PROMOTION:
        TemplateValidator.validatePromotionTemplate(template, errors, warnings);
        break;
      case TemplateCategory.PAYMENT:
        TemplateValidator.validatePaymentTemplate(template, errors, warnings);
        break;
      // 다른 카테고리들도 필요에 따라 추가
    }
  }

  private static validateAuthenticationTemplate(
    template: AlimTalkTemplate,
    errors: string[],
    warnings: string[],
  ): void {
    // 인증 템플릿은 일반적으로 인증번호 변수를 포함해야 함
    const hasAuthCode = (template.variables || []).some(
      (v) =>
        v.name.includes("인증") ||
        v.name.includes("코드") ||
        v.name.includes("번호"),
    );

    if (!hasAuthCode) {
      warnings.push(
        "Authentication template should include an authentication code variable",
      );
    }

    // 인증 템플릿은 일반적으로 버튼이 없어야 함
    if (template.buttons && template.buttons.length > 0) {
      warnings.push(
        "Authentication templates typically should not have buttons",
      );
    }
  }

  private static validatePromotionTemplate(
    template: AlimTalkTemplate,
    errors: string[],
    warnings: string[],
  ): void {
    // 프로모션 템플릿은 일반적으로 버튼을 포함해야 함
    if (!template.buttons || template.buttons.length === 0) {
      warnings.push("Promotion templates typically should have action buttons");
    }
  }

  private static validatePaymentTemplate(
    template: AlimTalkTemplate,
    errors: string[],
    warnings: string[],
  ): void {
    // 결제 템플릿은 금액 관련 변수를 포함해야 함
    const hasAmountVariable = (template.variables || []).some(
      (v) =>
        v.name.includes("금액") ||
        v.name.includes("가격") ||
        v.name.includes("원"),
    );

    if (!hasAmountVariable) {
      warnings.push("Payment template should include an amount variable");
    }
  }

  /**
   * 빠른 검증 - 기본적인 필수 필드만 검사
   */
  static quickValidate(template: Partial<AlimTalkTemplate>): ValidationResult {
    const errors: string[] = [];

    if (!template.name) errors.push("Name is required");
    if (!template.content) errors.push("Content is required");
    if (!template.category) errors.push("Category is required");
    if (!template.provider) errors.push("Provider is required");

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
