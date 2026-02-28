/**
 * Aligo template CRUD focused entrypoint.
 */

export {
  AligoTemplateProvider,
  createAligoTemplateProvider,
  createDefaultAligoTemplateProvider,
  AligoTemplateProviderFactory,
} from "./provider.template";
export {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  requestTemplateInspection,
  updateTemplate,
} from "./aligo.template";
export type { AligoConfig } from "./types/aligo";
