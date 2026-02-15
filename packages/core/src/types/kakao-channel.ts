export interface KakaoChannel {
  providerId: string;
  /**
   * Provider-specific Kakao channel key.
   * - Aligo: senderKey
   * - Solapi: pfId (profileId)
   */
  senderKey: string;
  /**
   * Kakao channel id including "@", when available (e.g. "@mybrand").
   */
  plusId?: string;
  name?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  raw?: unknown;
}

export interface KakaoCategoryEntry {
  code: string;
  name: string;
  parentCode?: string;
}

export interface KakaoChannelCategories {
  first: KakaoCategoryEntry[];
  second: KakaoCategoryEntry[];
  third: KakaoCategoryEntry[];
}
