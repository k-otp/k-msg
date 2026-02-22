import { KMsgError, KMsgErrorCode, type KMsgErrorMetadata } from "../errors";
import type { FieldCryptoFailMode, FieldCryptoOpenFallback } from "./types";

export type FieldCryptoErrorKind =
  | "config"
  | "encrypt"
  | "decrypt"
  | "hash"
  | "policy";

function resolveCode(kind: FieldCryptoErrorKind): KMsgErrorCode {
  switch (kind) {
    case "config":
      return KMsgErrorCode.CRYPTO_CONFIG_ERROR;
    case "encrypt":
      return KMsgErrorCode.CRYPTO_ENCRYPT_FAILED;
    case "decrypt":
      return KMsgErrorCode.CRYPTO_DECRYPT_FAILED;
    case "hash":
      return KMsgErrorCode.CRYPTO_HASH_FAILED;
    case "policy":
      return KMsgErrorCode.CRYPTO_POLICY_VIOLATION;
  }
}

export interface FieldCryptoErrorMetadata extends KMsgErrorMetadata {
  fieldPath?: string;
  failMode?: FieldCryptoFailMode;
  openFallback?: FieldCryptoOpenFallback;
}

export class FieldCryptoError extends KMsgError {
  readonly kind: FieldCryptoErrorKind;
  readonly fieldPath?: string;
  readonly failMode?: FieldCryptoFailMode;
  readonly openFallback?: FieldCryptoOpenFallback;

  constructor(
    kind: FieldCryptoErrorKind,
    message: string,
    details?: Record<string, unknown>,
    metadata: FieldCryptoErrorMetadata = {},
  ) {
    super(resolveCode(kind), message, details, metadata);
    this.name = "FieldCryptoError";
    this.kind = kind;
    this.fieldPath =
      typeof metadata.fieldPath === "string" ? metadata.fieldPath : undefined;
    this.failMode = metadata.failMode;
    this.openFallback = metadata.openFallback;
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
      fieldPath: this.fieldPath,
      failMode: this.failMode,
      openFallback: this.openFallback,
    };
  }
}
