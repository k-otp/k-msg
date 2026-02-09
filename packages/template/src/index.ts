/**
 * Template Engine
 * 템플릿 파싱, 변수 치환, 검증 기능 제공
 */

// 핵심 서비스
export { TemplateService } from './service';
export { TemplateService as MockTemplateService } from './services/template.service';

// 파서 및 유틸리티
export { VariableParser } from './parser/variable.parser';
export { ButtonParser } from './parser/button.parser';
export { TemplateValidator, type ValidationResult } from './parser/validator';
export { interpolate } from './interpolator';

// Template Builder
export { TemplateBuilder, TemplateBuilders } from './builder/template.builder';

// Template Registry
export { 
  TemplateRegistry,
  type TemplateSearchFilters,
  type TemplateSearchOptions,
  type TemplateSearchResult,
  type TemplateVersion,
  type TemplateHistory,
  type TemplateUsageStats,
  type TemplateRegistryOptions
} from './registry/template.registry';

// 타입 정의
export type {
  AlimTalkTemplate,
  TemplateVariable,
  TemplateButton
} from './types/template.types';

// Enum 정의
export { TemplateType, TemplateCategory, TemplateStatus } from './types/template.types';