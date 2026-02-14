/**
 * Variable replacement and personalization system
 */

import type { VariableMap } from "../types/message.types";

export interface VariableReplacementOptions {
  variablePattern: RegExp;
  allowUndefined: boolean;
  undefinedReplacement: string;
  caseSensitive: boolean;
  enableFormatting: boolean;
  enableConditionals: boolean;
  enableLoops: boolean;
  maxRecursionDepth: number;
}

export interface VariableInfo {
  name: string;
  value: any;
  formatted: string;
  type:
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "array"
    | "object"
    | "undefined";
  position: { start: number; end: number };
}

export interface ReplacementResult {
  content: string;
  variables: VariableInfo[];
  missingVariables: string[];
  errors: ReplacementError[];
  metadata: {
    originalLength: number;
    finalLength: number;
    variableCount: number;
    replacementTime: number;
  };
}

export interface ReplacementError {
  type:
    | "missing_variable"
    | "format_error"
    | "syntax_error"
    | "recursion_limit";
  message: string;
  variable?: string;
  position?: { start: number; end: number };
}

export interface ConditionalBlock {
  condition: string;
  content: string;
  elseContent?: string;
}

export interface LoopBlock {
  variable: string;
  array: string;
  content: string;
}

export class VariableReplacer {
  private defaultOptions: VariableReplacementOptions = {
    variablePattern: /#\{([^}]+)\}/g,
    allowUndefined: false,
    undefinedReplacement: "",
    caseSensitive: true,
    enableFormatting: true,
    enableConditionals: true,
    enableLoops: true,
    maxRecursionDepth: 10,
  };

  constructor(private options: Partial<VariableReplacementOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Replace variables in content
   */
  replace(content: string, variables: VariableMap): ReplacementResult {
    const startTime = Date.now();
    const originalLength = content.length;

    const result: ReplacementResult = {
      content,
      variables: [],
      missingVariables: [],
      errors: [],
      metadata: {
        originalLength,
        finalLength: 0,
        variableCount: 0,
        replacementTime: 0,
      },
    };

    try {
      // Step 1: Process conditionals if enabled
      if (this.options.enableConditionals) {
        result.content = this.processConditionals(
          result.content,
          variables,
          result,
        );
      }

      // Step 2: Process loops if enabled
      if (this.options.enableLoops) {
        result.content = this.processLoops(result.content, variables, result);
      }

      // Step 3: Replace simple variables
      result.content = this.replaceSimpleVariables(
        result.content,
        variables,
        result,
      );

      // Step 4: Handle nested replacements (recursive)
      if (this.hasVariables(result.content)) {
        result.content = this.replaceRecursive(
          result.content,
          variables,
          result,
          0,
        );
      }
    } catch (error) {
      result.errors.push({
        type: "syntax_error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Update metadata
    result.metadata.finalLength = result.content.length;
    result.metadata.variableCount = result.variables.length;
    result.metadata.replacementTime = Date.now() - startTime;

    return result;
  }

  /**
   * Extract variables from content without replacing
   */
  extractVariables(content: string): string[] {
    const variables = new Set<string>();
    const pattern = new RegExp(this.options.variablePattern!);

    let match: RegExpExecArray | null = pattern.exec(content);
    while (match !== null) {
      const variableName = this.parseVariableName(match[1]);
      variables.add(variableName);
      match = pattern.exec(content);
    }

    // Also extract from conditionals and loops
    if (this.options.enableConditionals) {
      const conditionals = this.extractConditionals(content);
      conditionals.forEach((conditional) => {
        const conditionVars = this.extractVariablesFromExpression(
          conditional.condition,
        );
        conditionVars.forEach((v) => {
          variables.add(v);
        });

        const contentVars = this.extractVariables(conditional.content);
        contentVars.forEach((v) => {
          variables.add(v);
        });

        if (conditional.elseContent) {
          const elseVars = this.extractVariables(conditional.elseContent);
          elseVars.forEach((v) => {
            variables.add(v);
          });
        }
      });
    }

    if (this.options.enableLoops) {
      const loops = this.extractLoops(content);
      loops.forEach((loop) => {
        variables.add(loop.array);
        const contentVars = this.extractVariables(loop.content);
        contentVars.forEach((v) => {
          variables.add(v);
        });
      });
    }

    return Array.from(variables);
  }

  /**
   * Validate that all required variables are provided
   */
  validate(
    content: string,
    variables: VariableMap,
  ): {
    isValid: boolean;
    missingVariables: string[];
    errors: ReplacementError[];
  } {
    const requiredVariables = this.extractVariables(content);
    const providedVariables = Object.keys(variables);

    const missingVariables = requiredVariables.filter((required) => {
      const normalizedRequired = this.options.caseSensitive
        ? required
        : required.toLowerCase();
      return !providedVariables.some((provided) => {
        const normalizedProvided = this.options.caseSensitive
          ? provided
          : provided.toLowerCase();
        return normalizedProvided === normalizedRequired;
      });
    });

    const errors: ReplacementError[] = missingVariables.map((variable) => ({
      type: "missing_variable",
      message: `Missing required variable: ${variable}`,
      variable,
    }));

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      errors,
    };
  }

  /**
   * Preview replacement result without actually replacing
   */
  preview(
    content: string,
    variables: VariableMap,
  ): {
    originalContent: string;
    previewContent: string;
    variableHighlights: Array<{
      variable: string;
      value: string;
      positions: Array<{ start: number; end: number }>;
    }>;
  } {
    const result = this.replace(content, variables);
    const highlights: {
      [key: string]: {
        value: string;
        positions: Array<{ start: number; end: number }>;
      };
    } = {};

    // Find all variable positions in original content
    const pattern = new RegExp(this.options.variablePattern!);
    let match: RegExpExecArray | null = pattern.exec(content);
    while (match !== null) {
      const variableName = this.parseVariableName(match[1]);
      const value = this.getVariableValue(variableName, variables);

      if (!highlights[variableName]) {
        highlights[variableName] = { value: String(value), positions: [] };
      }

      highlights[variableName].positions.push({
        start: match.index,
        end: match.index + match[0].length,
      });

      match = pattern.exec(content);
    }

    const variableHighlights = Object.entries(highlights).map(
      ([variable, info]) => ({
        variable,
        value: info.value,
        positions: info.positions,
      }),
    );

    return {
      originalContent: content,
      previewContent: result.content,
      variableHighlights,
    };
  }

  private replaceSimpleVariables(
    content: string,
    variables: VariableMap,
    result: ReplacementResult,
  ): string {
    const pattern = new RegExp(this.options.variablePattern!, "g");

    return content.replace(pattern, (match, variableExpression, offset) => {
      try {
        const variableName = this.parseVariableName(variableExpression);
        const value = this.getVariableValue(variableName, variables);

        if (value === undefined || value === null) {
          if (!this.options.allowUndefined) {
            result.missingVariables.push(variableName);
            result.errors.push({
              type: "missing_variable",
              message: `Variable '${variableName}' is not defined`,
              variable: variableName,
              position: { start: offset, end: offset + match.length },
            });
          }
          return this.options.undefinedReplacement!;
        }

        // Apply formatting if enabled
        const formattedValue = this.options.enableFormatting
          ? this.formatValue(value, variableExpression)
          : String(value);

        // Track variable info
        result.variables.push({
          name: variableName,
          value,
          formatted: formattedValue,
          type: this.getValueType(value),
          position: { start: offset, end: offset + match.length },
        });

        return formattedValue;
      } catch (error) {
        result.errors.push({
          type: "format_error",
          message: error instanceof Error ? error.message : "Format error",
          variable: variableExpression,
          position: { start: offset, end: offset + match.length },
        });
        return match; // Return original if error
      }
    });
  }

  private replaceRecursive(
    content: string,
    variables: VariableMap,
    result: ReplacementResult,
    depth: number,
  ): string {
    if (depth >= this.options.maxRecursionDepth!) {
      result.errors.push({
        type: "recursion_limit",
        message: `Maximum recursion depth (${this.options.maxRecursionDepth}) exceeded`,
      });
      return content;
    }

    const replaced = this.replaceSimpleVariables(content, variables, result);

    if (this.hasVariables(replaced) && replaced !== content) {
      return this.replaceRecursive(replaced, variables, result, depth + 1);
    }

    return replaced;
  }

  private processConditionals(
    content: string,
    variables: VariableMap,
    result: ReplacementResult,
  ): string {
    const conditionals = this.extractConditionals(content);
    let processedContent = content;

    conditionals.forEach((conditional) => {
      try {
        const conditionResult = this.evaluateCondition(
          conditional.condition,
          variables,
        );
        const replacementContent = conditionResult
          ? conditional.content
          : conditional.elseContent || "";

        // Replace the entire conditional block
        const blockPattern = this.buildConditionalPattern(conditional);
        processedContent = processedContent.replace(
          blockPattern,
          replacementContent,
        );
      } catch (error) {
        result.errors.push({
          type: "syntax_error",
          message: `Error in conditional: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    });

    return processedContent;
  }

  private processLoops(
    content: string,
    variables: VariableMap,
    result: ReplacementResult,
  ): string {
    const loops = this.extractLoops(content);
    let processedContent = content;

    loops.forEach((loop) => {
      try {
        const arrayValue = this.getVariableValue(loop.array, variables);

        if (!Array.isArray(arrayValue)) {
          result.errors.push({
            type: "syntax_error",
            message: `Loop variable '${loop.array}' is not an array`,
          });
          return;
        }

        let loopContent = "";
        arrayValue.forEach((item, index) => {
          const loopVariables = {
            ...variables,
            [loop.variable]: item,
            [`${loop.variable}_index`]: index,
            [`${loop.variable}_first`]: index === 0,
            [`${loop.variable}_last`]: index === arrayValue.length - 1,
          };

          const itemContent = this.replaceSimpleVariables(
            loop.content,
            loopVariables,
            result,
          );
          loopContent += itemContent;
        });

        // Replace the entire loop block
        const blockPattern = this.buildLoopPattern(loop);
        processedContent = processedContent.replace(blockPattern, loopContent);
      } catch (error) {
        result.errors.push({
          type: "syntax_error",
          message: `Error in loop: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    });

    return processedContent;
  }

  private parseVariableName(expression: string): string {
    // Handle simple variable names and complex expressions
    const parts = expression.split("|");
    return parts[0].trim();
  }

  private getVariableValue(name: string, variables: VariableMap): any {
    // Support dot notation for nested objects
    const parts = name.split(".");
    let value: any = variables;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }

      // Handle case sensitivity
      if (this.options.caseSensitive) {
        value = value[part];
      } else {
        const key = Object.keys(value).find(
          (k) => k.toLowerCase() === part.toLowerCase(),
        );
        value = key ? value[key] : undefined;
      }
    }

    return value;
  }

  private formatValue(value: any, expression: string): string {
    if (!this.options.enableFormatting) {
      return String(value);
    }

    // Check for formatting instructions
    const parts = expression.split("|");
    if (parts.length < 2) {
      return String(value);
    }

    const formatter = parts[1].trim();

    try {
      switch (formatter) {
        case "upper":
          return String(value).toUpperCase();
        case "lower":
          return String(value).toLowerCase();
        case "capitalize":
          return (
            String(value).charAt(0).toUpperCase() +
            String(value).slice(1).toLowerCase()
          );
        case "number":
          return Number(value).toLocaleString();
        case "currency":
          return new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
          }).format(Number(value));
        case "date":
          return new Date(value).toLocaleDateString("ko-KR");
        case "datetime":
          return new Date(value).toLocaleString("ko-KR");
        case "time":
          return new Date(value).toLocaleTimeString("ko-KR");
        default:
          // Custom format patterns
          if (formatter.startsWith("date:")) {
            const format = formatter.substring(5);
            return this.formatDate(new Date(value), format);
          }
          if (formatter.startsWith("number:")) {
            const digits = parseInt(formatter.substring(7));
            return Number(value).toFixed(digits);
          }
          return String(value);
      }
    } catch (error) {
      // Return original value if formatting fails
      return String(value);
    }
  }

  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return format
      .replace("YYYY", String(year))
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds);
  }

  private getValueType(
    value: any,
  ):
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "array"
    | "object"
    | "undefined" {
    if (value === undefined || value === null) return "undefined";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (value instanceof Date) return "date";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    return "string";
  }

  private hasVariables(content: string): boolean {
    return this.options.variablePattern!.test(content);
  }

  private extractConditionals(content: string): ConditionalBlock[] {
    // Simple conditional syntax: {{if condition}}content{{else}}else-content{{/if}}
    const conditionalPattern = /\{\{if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs;
    const conditionals: ConditionalBlock[] = [];
    let match: RegExpExecArray | null = conditionalPattern.exec(content);
    while (match !== null) {
      const condition = match[1].trim();
      const fullContent = match[2];

      // Check for else block
      const elsePattern = /^(.*?)\{\{else\}\}(.*)$/s;
      const elseMatch = fullContent.match(elsePattern);

      if (elseMatch) {
        conditionals.push({
          condition,
          content: elseMatch[1],
          elseContent: elseMatch[2],
        });
      } else {
        conditionals.push({
          condition,
          content: fullContent,
        });
      }

      match = conditionalPattern.exec(content);
    }

    return conditionals;
  }

  private extractLoops(content: string): LoopBlock[] {
    // Simple loop syntax: {{for item in items}}content{{/for}}
    const loopPattern = /\{\{for\s+(\w+)\s+in\s+(\w+)\}\}(.*?)\{\{\/for\}\}/gs;
    const loops: LoopBlock[] = [];
    let match: RegExpExecArray | null = loopPattern.exec(content);
    while (match !== null) {
      loops.push({
        variable: match[1],
        array: match[2],
        content: match[3],
      });

      match = loopPattern.exec(content);
    }

    return loops;
  }

  private extractVariablesFromExpression(expression: string): string[] {
    const variables = new Set<string>();
    const variablePattern =
      /\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\b/g;
    let match: RegExpExecArray | null = variablePattern.exec(expression);
    while (match !== null) {
      variables.add(match[1]);

      match = variablePattern.exec(expression);
    }

    return Array.from(variables);
  }

  private evaluateCondition(
    condition: string,
    variables: VariableMap,
  ): boolean {
    try {
      // Simple condition evaluation (extend as needed)
      // Supports: variable, !variable, variable === value, variable !== value, etc.

      const normalizedCondition = condition.trim();

      // Handle negation
      if (normalizedCondition.startsWith("!")) {
        const variable = normalizedCondition.substring(1).trim();
        const value = this.getVariableValue(variable, variables);
        return !value;
      }

      // Handle equality checks
      if (normalizedCondition.includes("===")) {
        const [left, right] = normalizedCondition
          .split("===")
          .map((s) => s.trim());
        const leftValue = this.getVariableValue(left, variables);
        const rightValue =
          right.startsWith('"') || right.startsWith("'")
            ? right.slice(1, -1)
            : this.getVariableValue(right, variables);
        return leftValue === rightValue;
      }

      if (normalizedCondition.includes("!==")) {
        const [left, right] = normalizedCondition
          .split("!==")
          .map((s) => s.trim());
        const leftValue = this.getVariableValue(left, variables);
        const rightValue =
          right.startsWith('"') || right.startsWith("'")
            ? right.slice(1, -1)
            : this.getVariableValue(right, variables);
        return leftValue !== rightValue;
      }

      // Simple truthiness check
      const value = this.getVariableValue(normalizedCondition, variables);
      return Boolean(value);
    } catch (error) {
      return false;
    }
  }

  private buildConditionalPattern(conditional: ConditionalBlock): RegExp {
    const escapedCondition = conditional.condition.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const elsePattern = conditional.elseContent
      ? ".*?\\{\\{else\\}\\}.*?"
      : ".*?";
    return new RegExp(
      `\\{\\{if\\s+${escapedCondition}\\}\\}${elsePattern}\\{\\{/if\\}\\}`,
      "gs",
    );
  }

  private buildLoopPattern(loop: LoopBlock): RegExp {
    const escapedVariable = loop.variable.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const escapedArray = loop.array.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(
      `\\{\\{for\\s+${escapedVariable}\\s+in\\s+${escapedArray}\\}\\}.*?\\{\\{/for\\}\\}`,
      "gs",
    );
  }
}

/**
 * Default instance with Korean-optimized settings
 */
export const defaultVariableReplacer = new VariableReplacer({
  variablePattern: /#\{([^}]+)\}/g,
  allowUndefined: false,
  undefinedReplacement: "",
  caseSensitive: false, // More flexible for Korean usage
  enableFormatting: true,
  enableConditionals: true,
  enableLoops: true,
  maxRecursionDepth: 5,
});

/**
 * Utility functions
 */
export const VariableUtils = {
  /**
   * Extract all variables from content
   */
  extractVariables: (content: string): string[] => {
    return defaultVariableReplacer.extractVariables(content);
  },

  /**
   * Replace variables in content
   */
  replace: (content: string, variables: VariableMap): string => {
    return defaultVariableReplacer.replace(content, variables).content;
  },

  /**
   * Validate content has all required variables
   */
  validate: (content: string, variables: VariableMap): boolean => {
    return defaultVariableReplacer.validate(content, variables).isValid;
  },

  /**
   * Create personalized content for multiple recipients
   */
  personalize: (
    content: string,
    recipients: Array<{ phoneNumber: string; variables: VariableMap }>,
  ): Array<{ phoneNumber: string; content: string; errors?: string[] }> => {
    return recipients.map((recipient) => {
      const result = defaultVariableReplacer.replace(
        content,
        recipient.variables,
      );

      return {
        phoneNumber: recipient.phoneNumber,
        content: result.content,
        errors:
          result.errors.length > 0
            ? result.errors.map((e) => e.message)
            : undefined,
      };
    });
  },
};
