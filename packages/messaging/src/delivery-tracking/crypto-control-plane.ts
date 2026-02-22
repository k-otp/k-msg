import type {
  FieldCryptoCircuitState,
  FieldCryptoControlScope,
  FieldCryptoControlSignalEvent,
} from "@k-msg/core";
import type {
  DeliveryTrackingCryptoController,
  DeliveryTrackingCryptoOperationContext,
  DeliveryTrackingFieldCryptoControlSignalOptions,
} from "./store.interface";

interface ScopeState {
  state: FieldCryptoCircuitState;
  failures: number[];
  openUntil?: number;
  lastErrorClass?: string;
}

const KEY_ERROR_TOKENS = [
  "kid",
  "key",
  "kms",
  "vault",
  "decrypt key",
  "aad",
  "auth tag",
  "ciphertext envelope",
];

function nowMs(): number {
  return Date.now();
}

function trimOrUndefined(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toScopeParts(
  context: DeliveryTrackingCryptoOperationContext,
): FieldCryptoControlScope {
  return {
    tenantId: trimOrUndefined(context.tenantId),
    providerId: trimOrUndefined(context.providerId),
    kid: trimOrUndefined(context.kid),
  };
}

function toScopeKey(
  context: DeliveryTrackingCryptoOperationContext,
  mode: "tenant_provider_kid" | "tenant_provider",
): string {
  const parts = toScopeParts(context);
  if (mode === "tenant_provider") {
    return [
      parts.tenantId ?? "tenant:*",
      parts.providerId ?? "provider:*",
    ].join("|");
  }
  return [
    parts.tenantId ?? "tenant:*",
    parts.providerId ?? "provider:*",
    parts.kid ?? "kid:*",
  ].join("|");
}

function classifyError(error: unknown): string | undefined {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (KEY_ERROR_TOKENS.some((token) => message.includes(token))) {
      if (message.includes("aad")) return "aad_mismatch";
      if (message.includes("kid")) return "kid_mismatch";
      return "key_error";
    }
    return "crypto_error";
  }

  if (typeof error === "string") {
    const lower = error.toLowerCase();
    if (KEY_ERROR_TOKENS.some((token) => lower.includes(token))) {
      if (lower.includes("aad")) return "aad_mismatch";
      if (lower.includes("kid")) return "kid_mismatch";
      return "key_error";
    }
    return "crypto_error";
  }

  return undefined;
}

function shouldAutoOpen(errorClass: string | undefined): boolean {
  return (
    errorClass === "key_error" ||
    errorClass === "aad_mismatch" ||
    errorClass === "kid_mismatch"
  );
}

export interface CryptoCircuitControllerOptions {
  enabled?: boolean;
  scopeBy?: "tenant_provider_kid" | "tenant_provider";
  failureThreshold?: number;
  windowMs?: number;
  cooldownMs?: number;
  onStateChange?: (
    event: FieldCryptoControlSignalEvent,
  ) => void | Promise<void>;
  runbookTrigger?: (
    event: FieldCryptoControlSignalEvent,
  ) => void | Promise<void>;
}

export class CryptoCircuitController implements DeliveryTrackingCryptoController {
  private readonly options: Required<
    Pick<
      CryptoCircuitControllerOptions,
      "enabled" | "scopeBy" | "failureThreshold" | "windowMs" | "cooldownMs"
    >
  > &
    Pick<CryptoCircuitControllerOptions, "onStateChange" | "runbookTrigger">;
  private readonly stateByScope = new Map<string, ScopeState>();

  constructor(options: CryptoCircuitControllerOptions = {}) {
    this.options = {
      enabled: options.enabled !== false,
      scopeBy: options.scopeBy ?? "tenant_provider_kid",
      failureThreshold: Math.max(1, options.failureThreshold ?? 5),
      windowMs: Math.max(1_000, options.windowMs ?? 60_000),
      cooldownMs: Math.max(1, options.cooldownMs ?? 120_000),
      onStateChange: options.onStateChange,
      runbookTrigger: options.runbookTrigger,
    };
  }

  async beforeOperation(
    context: DeliveryTrackingCryptoOperationContext,
  ): Promise<{ allowed: boolean; state: FieldCryptoCircuitState }> {
    if (!this.options.enabled) {
      return { allowed: true, state: "closed" };
    }

    const scope = toScopeKey(context, this.options.scopeBy);
    const entry = this.stateByScope.get(scope);
    if (!entry) {
      return { allowed: true, state: "closed" };
    }

    if (entry.state !== "open") {
      return { allowed: true, state: entry.state };
    }

    const now = nowMs();
    if (typeof entry.openUntil === "number" && now < entry.openUntil) {
      return { allowed: false, state: "open" };
    }

    entry.state = "half-open";
    entry.openUntil = undefined;
    await this.emitSignal({
      state: "half-open",
      reason: "cooldown",
      scope,
      scopeParts: toScopeParts(context),
      operation: context.operation,
      at: now,
      errorClass: entry.lastErrorClass,
    });
    return { allowed: true, state: "half-open" };
  }

  async onSuccess(
    context: DeliveryTrackingCryptoOperationContext,
  ): Promise<void> {
    if (!this.options.enabled) return;

    const scope = toScopeKey(context, this.options.scopeBy);
    const entry = this.stateByScope.get(scope);
    if (!entry) return;

    const wasOpen = entry.state !== "closed";
    entry.state = "closed";
    entry.failures = [];
    entry.openUntil = undefined;
    entry.lastErrorClass = undefined;

    if (wasOpen) {
      await this.emitSignal({
        state: "closed",
        reason: "recovered",
        scope,
        scopeParts: toScopeParts(context),
        operation: context.operation,
        at: nowMs(),
      });
    }
  }

  async onFailure(
    context: DeliveryTrackingCryptoOperationContext & {
      error: unknown;
      errorClass?: string;
    },
  ): Promise<void> {
    if (!this.options.enabled) return;

    const errorClass = context.errorClass ?? classifyError(context.error);
    if (!shouldAutoOpen(errorClass)) {
      return;
    }

    const scope = toScopeKey(context, this.options.scopeBy);
    const current = this.stateByScope.get(scope) ?? {
      state: "closed",
      failures: [],
    };

    const now = nowMs();
    const cutoff = now - this.options.windowMs;
    current.failures = current.failures.filter((timestamp) => timestamp >= cutoff);
    current.failures.push(now);
    current.lastErrorClass = errorClass;

    const shouldOpen =
      current.state === "half-open" ||
      current.failures.length >= this.options.failureThreshold;

    if (shouldOpen) {
      current.state = "open";
      current.openUntil = now + this.options.cooldownMs;
      await this.emitSignal({
        state: "open",
        reason: "threshold",
        scope,
        scopeParts: toScopeParts(context),
        operation: context.operation,
        at: now,
        errorClass,
      });
    }

    this.stateByScope.set(scope, current);
  }

  private async emitSignal(event: FieldCryptoControlSignalEvent): Promise<void> {
    await this.options.onStateChange?.(event);
    if (event.state === "open") {
      await this.options.runbookTrigger?.(event);
    }
  }
}

export function createCryptoCircuitController(
  options: DeliveryTrackingFieldCryptoControlSignalOptions = {},
): CryptoCircuitController {
  return new CryptoCircuitController({
    enabled: options.enabled,
    scopeBy: options.scopeBy,
    failureThreshold: options.failureThreshold,
    windowMs: options.windowMs,
    cooldownMs: options.cooldownMs,
    onStateChange: options.onStateChange,
    runbookTrigger: options.runbookTrigger,
  });
}
