/**
 * Runtime template APIs
 */

export { interpolate } from "./interpolator";
export { ButtonParser } from "./parser/button.parser";
export { TemplateValidator, type ValidationResult } from "./parser/validator";
export { VariableParser } from "./parser/variable.parser";
export {
  type ConditionalBlock,
  defaultTemplatePersonalizer,
  type LoopBlock,
  type ReplacementError,
  type ReplacementResult,
  TemplatePersonalizer,
  type TemplatePersonalizerOptions,
  type TemplateVariableInfo,
  type TemplateVariableMap,
  TemplateVariableUtils,
} from "./personalization/variable.replacer";
export {
  type NormalizedTemplatePayload,
  parseTemplateButtons,
  type ValidateTemplatePayloadOptions,
  validateTemplatePayload,
} from "./runtime/template-input";
export { TemplateLifecycleService } from "./runtime/template-lifecycle.service";
export type {
  AlimTalkTemplate,
  TemplateButton,
  TemplateVariable,
} from "./types/template.types";
export {
  TemplateCategory,
  TemplateStatus,
  TemplateType,
} from "./types/template.types";
