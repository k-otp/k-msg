import type { ProviderConfig } from "@k-msg/core";

export interface SolapiConfig extends ProviderConfig {
  /**
   * SOLAPI API Secret
   */
  apiSecret: string;

  /**
   * Default sender number (SMS/LMS/MMS/RCS).
   */
  defaultFrom?: string;

  /**
   * Default Kakao PF ID (for ALIMTALK/FRIENDTALK).
   */
  kakaoPfId?: string;

  /**
   * Default RCS Brand ID.
   */
  rcsBrandId?: string;

  /**
   * Optional appId for Solapi send APIs.
   */
  appId?: string;

  /**
   * Default country code (e.g. "82"). Optional.
   */
  defaultCountry?: string;
}
