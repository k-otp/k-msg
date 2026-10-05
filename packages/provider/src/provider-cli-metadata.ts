import type { MessageType } from "@k-msg/core";
import type { ProviderTypeWithConfig } from "./config-fields";
import { resolveIwinvMessageTypes } from "./iwinv/iwinv.capabilities";

export interface ProviderCliMetadata {
  label: string;
  routingSeedTypes: readonly MessageType[];
  /**
   * The routing seed types for one configured entry, when they depend on its
   * credentials; `routingSeedTypes` otherwise.
   */
  routingSeedTypesForConfig?: (
    config: Readonly<Record<string, unknown>>,
  ) => readonly MessageType[];
  defaultKakaoSenderKey?: string;
}

export const providerCliMetadata: Record<
  ProviderTypeWithConfig,
  ProviderCliMetadata
> = {
  mock: {
    label: "Mock (local test)",
    routingSeedTypes: [
      "ALIMTALK",
      "FRIENDTALK",
      "SMS",
      "LMS",
      "MMS",
      "NSA",
      "VOICE",
      "FAX",
      "RCS_SMS",
      "RCS_LMS",
      "RCS_MMS",
      "RCS_TPL",
      "RCS_ITPL",
      "RCS_LTPL",
    ],
    defaultKakaoSenderKey: "env:MOCK_SENDER_KEY",
  },
  aligo: {
    label: "Aligo",
    routingSeedTypes: ["ALIMTALK", "FRIENDTALK", "SMS", "LMS", "MMS"],
    defaultKakaoSenderKey: "env:ALIGO_SENDER_KEY",
  },
  iwinv: {
    label: "IWINV",
    routingSeedTypes: ["ALIMTALK", "SMS", "LMS", "MMS", "RCS_TPL"],
    // AlimTalk needs apiKey, SMS the SMS keys and RCS rcsApiKey, so an entry
    // routes only the types its credentials can send.
    routingSeedTypesForConfig: resolveIwinvMessageTypes,
  },
  solapi: {
    label: "SOLAPI",
    routingSeedTypes: [
      "ALIMTALK",
      "FRIENDTALK",
      "SMS",
      "LMS",
      "MMS",
      "NSA",
      "VOICE",
      "FAX",
      "RCS_SMS",
      "RCS_LMS",
      "RCS_MMS",
      "RCS_TPL",
      "RCS_ITPL",
      "RCS_LTPL",
    ],
    defaultKakaoSenderKey: "env:SOLAPI_KAKAO_PF_ID",
  },
};
