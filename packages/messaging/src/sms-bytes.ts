/** The bytes an SMS holds; `KMsg` sends longer text as LMS by default. */
export const DEFAULT_AUTO_LMS_BYTES = 90;

/**
 * Estimates the bytes a text takes as an SMS or LMS, counted the way `KMsg`
 * counts them to choose between the two: one byte for each ASCII character
 * and two for any other, such as Hangul. `KMsg` sends text over
 * `defaults.sms.autoLmsBytes` (90 by default) as LMS.
 *
 * @example
 * ```ts
 * estimateSmsBytes("Hello"); // 5
 * estimateSmsBytes("안녕하세요"); // 10
 * ```
 */
export function estimateSmsBytes(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    bytes += text.charCodeAt(index) <= 0x7f ? 1 : 2;
  }
  return bytes;
}
