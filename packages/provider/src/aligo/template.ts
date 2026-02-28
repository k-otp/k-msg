/**
 * Aligo template CRUD focused entrypoint.
 */

export {
  createTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
  requestTemplateInspection,
  updateTemplate,
} from "./aligo.template";
export {
  AligoTemplateProvider,
  AligoTemplateProviderFactory,
  createAligoTemplateProvider,
  createDefaultAligoTemplateProvider,
} from "./provider.template";
export type { AligoConfig } from "./types/aligo";
