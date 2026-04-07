/**
 * SOLAPI Provider package entrypoint
 *
 * Keep these as explicit value bindings instead of a direct re-export.
 * Bun's minifier has produced invalid alias-only output for the re-export
 * form during workspace builds, which then breaks CLI compile.
 */

import * as provider from "./provider";

export const initializeSolapi = provider.initializeSolapi;
export const createSolapiProvider = provider.createSolapiProvider;
export const createDefaultSolapiProvider = provider.createDefaultSolapiProvider;
export const SolapiProviderFactory = provider.SolapiProviderFactory;
export const SolapiProvider = provider.SolapiProvider;
export type { SolapiConfig } from "./types/solapi";
