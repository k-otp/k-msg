import type { MessageType } from "@k-msg/core";
import type { ProviderTypeWithConfig } from "./config-fields";

export interface ProviderCliMetadata {
  label: string;
  routingSeedTypes: readonly MessageType[];
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
    routingSeedTypes: ["ALIMTALK", "SMS", "LMS", "MMS"],
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
