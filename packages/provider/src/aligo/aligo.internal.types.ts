import type { ProviderRequestContext } from "@k-msg/core";
import type { TemplateContentCache } from "../shared/template-content-cache";
import type { AligoConfig } from "./types/aligo";

export type AligoMessageType =
  | "SMS"
  | "LMS"
  | "MMS"
  | "ALIMTALK"
  | "FRIENDTALK";

export type AligoRuntimeContext = {
  providerId: string;
  config: AligoConfig;
  smsHost: string;
  alimtalkHost: string;
  requestContext?: ProviderRequestContext;
  /** Template bodies used to render AlimTalk messages; absent, each send looks its template up. */
  templateContents?: TemplateContentCache;
};
