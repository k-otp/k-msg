/**
 * Field-crypto re-exports kept on the `k-msg` root for backward compatibility.
 *
 * These belong to `k-msg/core` (or `@k-msg/core`). The root facade stays
 * limited to the send flow; each alias below is deprecated and will be removed
 * in a future minor release.
 */

import * as core from "@k-msg/core";

/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const assertFieldCryptoConfig: typeof core.assertFieldCryptoConfig =
  core.assertFieldCryptoConfig;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createAesGcmFieldCryptoProvider: typeof core.createAesGcmFieldCryptoProvider =
  core.createAesGcmFieldCryptoProvider;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createAwsKmsKeyResolver: typeof core.createAwsKmsKeyResolver =
  core.createAwsKmsKeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createDefaultMasker: typeof core.createDefaultMasker =
  core.createDefaultMasker;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createEnvKeyResolver: typeof core.createEnvKeyResolver =
  core.createEnvKeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createNoopFieldCryptoProvider: typeof core.createNoopFieldCryptoProvider =
  core.createNoopFieldCryptoProvider;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createRefreshableKeyResolver: typeof core.createRefreshableKeyResolver =
  core.createRefreshableKeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createRollingKeyResolver: typeof core.createRollingKeyResolver =
  core.createRollingKeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createStaticKeyResolver: typeof core.createStaticKeyResolver =
  core.createStaticKeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const createVaultTransitKeyResolver: typeof core.createVaultTransitKeyResolver =
  core.createVaultTransitKeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const getRolloutKnownKids: typeof core.getRolloutKnownKids =
  core.getRolloutKnownKids;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const normalizePhoneForHash: typeof core.normalizePhoneForHash =
  core.normalizePhoneForHash;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const resolveFieldMode: typeof core.resolveFieldMode =
  core.resolveFieldMode;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const selectActiveKidByRollout: typeof core.selectActiveKidByRollout =
  core.selectActiveKidByRollout;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const toCiphertextEnvelopeString: typeof core.toCiphertextEnvelopeString =
  core.toCiphertextEnvelopeString;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const validateFieldCryptoConfig: typeof core.validateFieldCryptoConfig =
  core.validateFieldCryptoConfig;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export const FieldCryptoError: typeof core.FieldCryptoError =
  core.FieldCryptoError;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoError = core.FieldCryptoError;

/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type ActiveKidRolloutBucket = core.ActiveKidRolloutBucket;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type ActiveKidRolloutPolicy = core.ActiveKidRolloutPolicy;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type AesGcmFieldCryptoProviderOptions =
  core.AesGcmFieldCryptoProviderOptions;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type AwsKmsKeyResolverClient = core.AwsKmsKeyResolverClient;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type AwsKmsKeyResolverOptions = core.AwsKmsKeyResolverOptions;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type CryptoEnvelope = core.CryptoEnvelope;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type EnvKeyResolverOptions = core.EnvKeyResolverOptions;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoAad = core.FieldCryptoAad;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoCircuitState = core.FieldCryptoCircuitState;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoConfig = core.FieldCryptoConfig;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoControlScope = core.FieldCryptoControlScope;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoControlSignalEvent = core.FieldCryptoControlSignalEvent;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoDecryptInput = core.FieldCryptoDecryptInput;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoEncryptInput = core.FieldCryptoEncryptInput;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoErrorKind = core.FieldCryptoErrorKind;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoErrorMetadata = core.FieldCryptoErrorMetadata;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoFailMode = core.FieldCryptoFailMode;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoHashInput = core.FieldCryptoHashInput;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoKeyContext = core.FieldCryptoKeyContext;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoMaskInput = core.FieldCryptoMaskInput;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoMetricEvent = core.FieldCryptoMetricEvent;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoMetricName = core.FieldCryptoMetricName;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoOpenFallback = core.FieldCryptoOpenFallback;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoPolicyOptions = core.FieldCryptoPolicyOptions;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoPolicyValidationIssue =
  core.FieldCryptoPolicyValidationIssue;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoPolicyValidationResult =
  core.FieldCryptoPolicyValidationResult;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldCryptoProvider = core.FieldCryptoProvider;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type FieldMode = core.FieldMode;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type KeyResolver = core.KeyResolver;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type KeySetState = core.KeySetState;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type KeySetStateProvider = core.KeySetStateProvider;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type RefreshableKeyResolverOptions = core.RefreshableKeyResolverOptions;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type StaticKeyResolverOptions = core.StaticKeyResolverOptions;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type VaultTransitKeyResolverClient = core.VaultTransitKeyResolverClient;
/** @deprecated Import from "k-msg/core" (or "@k-msg/core") instead. @hidden */
export type VaultTransitKeyResolverOptions =
  core.VaultTransitKeyResolverOptions;
