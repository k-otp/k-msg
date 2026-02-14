import type { TemplateVariable } from "../types/template.types";

export class VariableParser {
  private static readonly VARIABLE_PATTERN = /#{([^}]+)}/g;

  /**
   * 템플릿 내용에서 변수를 추출합니다
   */
  static extractVariables(content: string): string[] {
    const variables: string[] = [];
    const matches = content.matchAll(VariableParser.VARIABLE_PATTERN);

    for (const match of matches) {
      const variableName = match[1].trim();
      if (variableName && !variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  /**
   * 템플릿 내용의 변수를 실제 값으로 치환합니다
   */
  static replaceVariables(
    content: string,
    variables: Record<string, string | number | Date>,
  ): string {
    return content.replace(
      VariableParser.VARIABLE_PATTERN,
      (match, variableName) => {
        const value = variables[variableName.trim()];

        if (value === undefined || value === null) {
          return match; // 값이 없으면 원래 변수 그대로 유지
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        return String(value);
      },
    );
  }

  /**
   * 변수 정의와 실제 제공된 값을 검증합니다
   */
  static validateVariables(
    variableDefinitions: TemplateVariable[],
    providedVariables: Record<string, any>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const definition of variableDefinitions) {
      const value = providedVariables[definition.name];

      // 필수 변수 체크
      if (definition.required && (value === undefined || value === null)) {
        errors.push(`Required variable '${definition.name}' is missing`);
        continue;
      }

      // 값이 없으면 옵셔널 변수로 간주하고 다음으로
      if (value === undefined || value === null) {
        continue;
      }

      // 타입 검증
      if (!VariableParser.validateVariableType(value, definition.type)) {
        errors.push(
          `Variable '${definition.name}' has invalid type. Expected: ${definition.type}`,
        );
      }

      // 길이 검증
      if (definition.maxLength && String(value).length > definition.maxLength) {
        errors.push(
          `Variable '${definition.name}' exceeds maximum length of ${definition.maxLength}`,
        );
      }

      // 포맷 검증 (정규식)
      if (
        definition.format &&
        !new RegExp(definition.format).test(String(value))
      ) {
        errors.push(
          `Variable '${definition.name}' does not match required format: ${definition.format}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateVariableType(
    value: any,
    expectedType: string,
  ): boolean {
    switch (expectedType) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "date":
        return value instanceof Date || !isNaN(Date.parse(value));
      case "custom":
        return true; // 커스텀 타입은 별도 검증 로직 필요
      default:
        return false;
    }
  }

  /**
   * 템플릿에서 사용된 변수와 정의된 변수의 일치성을 검사합니다
   */
  static validateTemplateVariables(
    content: string,
    variableDefinitions: TemplateVariable[],
  ): { isValid: boolean; errors: string[] } {
    const usedVariables = VariableParser.extractVariables(content);
    const definedVariables = variableDefinitions.map((v) => v.name);
    const errors: string[] = [];

    // 사용된 변수가 정의되어 있는지 확인
    for (const usedVar of usedVariables) {
      if (!definedVariables.includes(usedVar)) {
        errors.push(
          `Variable '${usedVar}' is used in template but not defined`,
        );
      }
    }

    // 정의된 필수 변수가 템플릿에서 사용되는지 확인
    for (const definition of variableDefinitions) {
      if (definition.required && !usedVariables.includes(definition.name)) {
        errors.push(
          `Required variable '${definition.name}' is defined but not used in template`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
