/**
 * Aligo send/channel focused entrypoint.
 */

export {
  AligoSendProvider as AligoProvider,
  AligoSendProvider,
  AligoSendProviderFactory,
  createAligoSendProvider as createAligoProvider,
  createAligoSendProvider,
  createDefaultAligoSendProvider as createDefaultAligoProvider,
  createDefaultAligoSendProvider,
} from "./provider.send";
export type { AligoConfig } from "./types/aligo";
