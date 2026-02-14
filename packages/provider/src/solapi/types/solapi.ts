export interface SolapiConfig {
  /**
   * SOLAPI API Key
   */
  apiKey: string;

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
   * Default Naver Talk ID (for NSA).
   */
  naverTalkId?: string;

  /**
   * Optional appId for Solapi send APIs.
   */
  appId?: string;

  /**
   * Default country code (e.g. "82"). Optional.
   */
  defaultCountry?: string;

  /**
   * Base URL for SOLAPI API.
   */
  baseUrl?: string;

  debug?: boolean;
}
