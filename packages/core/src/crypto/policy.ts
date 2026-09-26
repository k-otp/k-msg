import { FieldCryptoError } from "./errors";
import type { FieldCryptoConfig, FieldMode } from "./types";

export interface FieldCryptoPolicyValidationIssue {
  message: string;
  rule: string;
  path?: string;
  hint?: string;
}

export interface FieldCryptoPolicyOptions {
  secureMode?: boolean;
  compatPlainColumns?: boolean;
}

export interface FieldCryptoPolicyValidationResult {
  valid: boolean;
  issues: FieldCryptoPolicyValidationIssue[];
}

function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveFieldMode(
  config: FieldCryptoConfig,
  path: string,
  fallback: FieldMode,
): FieldMode {
  const exact = config.fields[path];
  if (exact) return exact;

  if (path.startsWith("metadata.")) {
    const wildcard = config.fields["metadata.*"];
    if (wildcard) return wildcard;
  }

  return fallback;
}

export function validateFieldCryptoConfig(
  config: FieldCryptoConfig,
  options: FieldCryptoPolicyOptions = {},
): FieldCryptoPolicyValidationResult {
  const issues: FieldCryptoPolicyValidationIssue[] = [];

  if (!config || typeof config !== "object") {
    return {
      valid: false,
      issues: [
        {
          message: "fieldCrypto config must be an object",
          rule: "fieldCrypto.config.object",
          hint: "Provide a valid FieldCryptoConfig object",
        },
      ],
    };
  }

  if (!config.provider || typeof config.provider !== "object") {
    issues.push({
      message: "fieldCrypto provider is required",
      rule: "fieldCrypto.provider.required",
      path: "provider",
      hint: "Set provider with encrypt/decrypt/hash methods",
    });
  } else {
    if (!isFunction(config.provider.encrypt)) {
      issues.push({
        message: "provider.encrypt must be a function",
        rule: "fieldCrypto.provider.encrypt.required",
        path: "provider.encrypt",
      });
    }
    if (!isFunction(config.provider.decrypt)) {
      issues.push({
        message: "provider.decrypt must be a function",
        rule: "fieldCrypto.provider.decrypt.required",
        path: "provider.decrypt",
      });
    }
    if (!isFunction(config.provider.hash)) {
      issues.push({
        message: "provider.hash must be a function",
        rule: "fieldCrypto.provider.hash.required",
        path: "provider.hash",
      });
    }
  }

  if (!config.fields || typeof config.fields !== "object") {
    issues.push({
      message: "fieldCrypto.fields must be an object",
      rule: "fieldCrypto.fields.object",
      path: "fields",
      hint: "Define policies such as to, from, metadata.phoneNumber",
    });
  } else {
    const entries = Object.entries(config.fields);
    if (entries.length === 0) {
      issues.push({
        message: "fieldCrypto.fields must not be empty",
        rule: "fieldCrypto.fields.non_empty",
        path: "fields",
        hint: "Add at least one field mode mapping",
      });
    }

    for (const [path, mode] of entries) {
      const normalizedPath = normalizeString(path);
      if (!normalizedPath) {
        issues.push({
          message: "field path must be a non-empty string",
          rule: "fieldCrypto.fields.path.non_empty",
          path: "fields",
        });
      }

      if (
        mode !== "plain" &&
        mode !== "encrypt" &&
        mode !== "encrypt+hash" &&
        mode !== "mask"
      ) {
        issues.push({
          message: `unsupported field mode: ${String(mode)}`,
          rule: "fieldCrypto.fields.mode.supported",
          path: `fields.${path}`,
        });
      }
    }
  }

  const failMode = config.failMode ?? "closed";
  const openFallback = config.openFallback ?? "masked";
  if (
    failMode === "open" &&
    openFallback === "plaintext" &&
    config.unsafeAllowPlaintextStorage !== true
  ) {
    issues.push({
      message:
        "openFallback=plaintext requires unsafeAllowPlaintextStorage=true",
      rule: "fieldCrypto.fail_open.plaintext_guard",
      path: "openFallback",
      hint: "Use masked/null fallback, or explicitly enable unsafe plaintext",
    });
  }

  if (Array.isArray(config.aadFields)) {
    if (config.aadFields.length === 0) {
      issues.push({
        message: "aadFields must not be empty when provided",
        rule: "fieldCrypto.aad_fields.non_empty",
        path: "aadFields",
      });
    }

    for (let index = 0; index < config.aadFields.length; index += 1) {
      const key = config.aadFields[index];
      if (!normalizeString(key)) {
        issues.push({
          message: "aadFields cannot include empty key",
          rule: "fieldCrypto.aad_fields.no_empty_key",
          path: `aadFields[${index}]`,
        });
      }
    }
  }

  if (options.secureMode && !options.compatPlainColumns) {
    const toMode = resolveFieldMode(config, "to", "encrypt+hash");
    const fromMode = resolveFieldMode(config, "from", "encrypt+hash");

    if (toMode === "plain") {
      issues.push({
        message:
          "secure mode requires non-plain policy for `to` when compatPlainColumns=false",
        rule: "fieldCrypto.secure_mode.to_non_plain",
        path: "fields.to",
        hint: "Use encrypt+hash for lookup fields",
      });
    }

    if (fromMode === "plain") {
      issues.push({
        message:
          "secure mode requires non-plain policy for `from` when compatPlainColumns=false",
        rule: "fieldCrypto.secure_mode.from_non_plain",
        path: "fields.from",
        hint: "Use encrypt+hash for lookup fields",
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertFieldCryptoConfig(
  config: FieldCryptoConfig,
  options: FieldCryptoPolicyOptions = {},
): void {
  const result = validateFieldCryptoConfig(config, options);
  if (result.valid) return;

  const first = result.issues[0];
  if (!first) {
    throw new FieldCryptoError(
      "config",
      "fieldCrypto config validation failed",
      {
        rule: "fieldCrypto.config.invalid",
        issues: result.issues,
      },
    );
  }

  throw new FieldCryptoError(
    "config",
    first.message,
    {
      rule: first.rule,
      path: first.path,
      hint: first.hint,
      issues: result.issues,
    },
    {
      fieldPath: first.path,
    },
  );
}
