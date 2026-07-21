import type { ProviderRequestContext } from "@k-msg/core";
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
};
