import { createDefaultMasker } from "k-msg/core";

// 010 numbers have 8 digits after the prefix; legacy 011/016-019 have 7 or 8.
const KOREAN_MOBILE = /^01(?:0\d{8}|[16789]\d{7,8})$/;

/**
 * Accepts 010-1234-5678, 01012345678 or +82 10-1234-5678 and returns the
 * digits-only domestic form, or undefined for anything else.
 */
export function normalizeMobileNumber(input: string): string | undefined {
  const compact = input.replace(/[\s-]/g, "");
  const domestic = compact.startsWith("+82")
    ? `0${compact.slice(3).replace(/^0/, "")}`
    : compact;
  return KOREAN_MOBILE.test(domestic) ? domestic : undefined;
}

/** For logs and responses: 01012345678 becomes 010******78. */
export const maskPhone = createDefaultMasker();
