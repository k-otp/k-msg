import {
  createRefreshableKeyResolver,
  type KeySetStateProvider,
} from "../key-resolver";
import type { FieldCryptoKeyContext, KeyResolver, KeySetState } from "../types";

export interface VaultTransitKeyResolverClient {
  getKeyState(
    context: FieldCryptoKeyContext & {
      mountPath?: string;
      keyName?: string;
      namespace?: string;
    },
  ): Promise<KeySetState>;
}

export interface VaultTransitKeyResolverOptions {
  client: VaultTransitKeyResolverClient;
  mountPath?: string;
  keyName?: string;
  namespace?: string;
  cacheTtlMs?: number;
  fallbackActiveKid?: string;
  fallbackDecryptKids?: readonly string[];
}

export function createVaultTransitKeyResolver(
  options: VaultTransitKeyResolverOptions,
): KeyResolver {
  const provider: KeySetStateProvider = {
    async loadKeySet(context) {
      return options.client.getKeyState({
        ...context,
        ...(options.mountPath ? { mountPath: options.mountPath } : {}),
        ...(options.keyName ? { keyName: options.keyName } : {}),
        ...(options.namespace ? { namespace: options.namespace } : {}),
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
