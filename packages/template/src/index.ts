/**
 * Runtime template APIs
 */

export { interpolate } from "./interpolator";
export { ButtonParser } from "./parser/button.parser";
export { TemplateValidator, type ValidationResult } from "./parser/validator";
export { VariableParser } from "./parser/variable.parser";
export {
  defaultTemplatePersonalizer,
  TemplatePersonalizer,
  TemplateVariableUtils,
  type ConditionalBlock,
  type LoopBlock,
  type ReplacementError,
  type ReplacementResult,
  type TemplatePersonalizerOptions,
  type TemplateVariableInfo,
  type TemplateVariableMap,
} from "./personalization/variable.replacer";
export { TemplateLifecycleService } from "./runtime/template-lifecycle.service";
export {
  parseTemplateButtons,
  validateTemplatePayload,
  type NormalizedTemplatePayload,
  type ValidateTemplatePayloadOptions,
} from "./runtime/template-input";
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
