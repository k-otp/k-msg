/**
 * Template Engine
 * 템플릿 파싱, 변수 치환, 검증 기능 제공
 */

// Template Builder
export { TemplateBuilder, TemplateBuilders } from "./builder/template.builder";
export { interpolate } from "./interpolator";
export { ButtonParser } from "./parser/button.parser";
export { TemplateValidator, type ValidationResult } from "./parser/validator";
// 파서 및 유틸리티
export { VariableParser } from "./parser/variable.parser";
// Template Registry
export {
  type TemplateHistory,
  TemplateRegistry,
  type TemplateRegistryOptions,
  type TemplateSearchFilters,
  type TemplateSearchOptions,
  type TemplateSearchResult,
  type TemplateUsageStats,
  type TemplateVersion,
} from "./registry/template.registry";
// 핵심 서비스
export { TemplateService } from "./service";
export { TemplateService as MockTemplateService } from "./services/template.service";

// 타입 정의
export type {
  AlimTalkTemplate,
  TemplateButton,
  TemplateVariable,
} from "./types/template.types";

// Enum 정의
export {
  TemplateCategory,
  TemplateStatus,
  TemplateType,
} from "./types/template.types";
