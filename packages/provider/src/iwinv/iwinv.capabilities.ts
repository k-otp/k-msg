import type { MessageType } from "@k-msg/core";

function isSet(value: unknown): boolean {
  return typeof value === "string"
    ? value.length > 0
    : value !== undefined && value !== null;
}

/**
 * Message types an IWINV configuration can send. AlimTalk needs `apiKey`;
 * SMS, LMS and MMS need `smsApiKey` and `smsAuthKey`, or one of them together
 * with `apiKey` (the legacy key pair); RCS templates (`RCS_TPL`) need
 * `rcsApiKey`.
 */
export function resolveIwinvMessageTypes(config: {
  apiKey?: unknown;
  smsApiKey?: unknown;
  smsAuthKey?: unknown;
  rcsApiKey?: unknown;
}): MessageType[] {
  const hasApiKey = isSet(config.apiKey);
  const hasSmsKey = isSet(config.smsApiKey) || isSet(config.smsAuthKey);
  const hasSmsKeys =
    (isSet(config.smsApiKey) && isSet(config.smsAuthKey)) ||
    (hasApiKey && hasSmsKey);

  const types: MessageType[] = [];
  if (hasApiKey) types.push("ALIMTALK");
  if (hasSmsKeys) types.push("SMS", "LMS", "MMS");
  if (isSet(config.rcsApiKey)) types.push("RCS_TPL");
  return types;
}
