/**
 * Send-path template utilities.
 */

export { interpolate } from "../interpolator";
export { ButtonParser } from "../parser/button.parser";
export {
  type NormalizedTemplatePayload,
  parseTemplateButtons,
  type ValidateTemplatePayloadOptions,
  validateTemplatePayload,
} from "../runtime/template-input";
export type { TemplateButton } from "../types/template.types";
