import {
  createRefreshableKeyResolver,
  type KeySetStateProvider,
} from "../key-resolver";
import type { FieldCryptoKeyContext, KeyResolver, KeySetState } from "../types";

export interface AwsKmsKeyResolverClient {
  getKeyState(
    context: FieldCryptoKeyContext & {
      keyAlias?: string;
      region?: string;
    },
  ): Promise<KeySetState>;
}

export interface AwsKmsKeyResolverOptions {
  client: AwsKmsKeyResolverClient;
  keyAlias?: string;
  region?: string;
  cacheTtlMs?: number;
  fallbackActiveKid?: string;
  fallbackDecryptKids?: readonly string[];
}

export function createAwsKmsKeyResolver(
  options: AwsKmsKeyResolverOptions,
): KeyResolver {
  const provider: KeySetStateProvider = {
    async loadKeySet(context) {
      return options.client.getKeyState({
        ...context,
        ...(options.keyAlias ? { keyAlias: options.keyAlias } : {}),
        ...(options.region ? { region: options.region } : {}),
      });
    },
  };

  return createRefreshableKeyResolver({
    provider,
    cacheTtlMs: options.cacheTtlMs,
    fallback: {
      activeKid: options.fallbackActiveKid,
      decryptKids: options.fallbackDecryptKids,
    },
  });
}
