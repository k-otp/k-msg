const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function toBase64(bytes: Uint8Array): string {
  let output = "";
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++] ?? 0;
    const b = bytes[i++] ?? 0;
    const c = bytes[i++] ?? 0;

    const chunk = (a << 16) | (b << 8) | c;
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += i - 2 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : "=";
    output += i - 1 < bytes.length ? BASE64_ALPHABET[chunk & 63] : "=";
  }

  return output;
}

export function utf8ToBase64(value: string): string {
  return toBase64(new TextEncoder().encode(value));
}
