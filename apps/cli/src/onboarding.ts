import type {
  KakaoChannelProvider,
  Provider,
  ProviderOnboardingCheckKind,
  ProviderOnboardingScope,
  ProviderOnboardingSeverity,
  ProviderOnboardingSpec,
  TemplateContext,
  TemplateProvider,
} from "@k-msg/core";
import type { KMsgCliConfig } from "./config/schema";
import type { ProviderWithCapabilities } from "./providers/registry";
import type { Runtime } from "./runtime";

export type OnboardingCheckStatus = "pass" | "fail" | "skip";

export interface OnboardingCheckResult {
  id: string;
  title: string;
  kind: ProviderOnboardingCheckKind;
  severity: ProviderOnboardingSeverity;
  status: OnboardingCheckStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProviderDoctorResult {
  providerId: string;
  providerName: string;
  spec?: ProviderOnboardingSpec;
  checks: OnboardingCheckResult[];
  healthy: boolean;
  ok: boolean;
}

export interface AlimTalkPreflightResult {
  providerId: string;
  providerName: string;
  spec?: ProviderOnboardingSpec;
  checks: OnboardingCheckResult[];
  inferredPlusId?: string;
  ok: boolean;
}

function supportsScope(
  check: { scopes: ProviderOnboardingScope[] },
  scope: ProviderOnboardingScope,
): boolean {
  return Array.isArray(check.scopes) && check.scopes.includes(scope);
}

function getManualCheckState(
  config: KMsgCliConfig,
  providerId: string,
  checkId: string,
): { done: boolean; checkedAt?: string; note?: string; evidence?: string } {
  const state =
    config.onboarding?.manualChecks?.[providerId]?.[checkId] ??
    ({
      done: false,
    } as const);
  const stateRecord = state as Record<string, unknown>;
  return {
    done: stateRecord.done === true,
    ...(typeof stateRecord.checkedAt === "string"
      ? { checkedAt: stateRecord.checkedAt }
      : {}),
    ...(typeof stateRecord.note === "string" ? { note: stateRecord.note } : {}),
    ...(typeof stateRecord.evidence === "string"
      ? { evidence: stateRecord.evidence }
      : {}),
  };
}

function getProviderConfig(
  config: KMsgCliConfig,
  providerId: string,
): Record<string, unknown> {
  const entry = config.providers.find((p) => p.id === providerId);
  return (entry?.config ?? {}) as Record<string, unknown>;
}

function getProviderEntry(
  config: KMsgCliConfig,
  providerId: string,
): KMsgCliConfig["providers"][number] | undefined {
  return config.providers.find((entry) => entry.id === providerId);
}

function getPathValue(root: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".").filter((v) => v.length > 0);
  let current: unknown = root;
  for (const part of parts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function hasCallable(provider: Provider, methodName: string): boolean {
  return (
    typeof (provider as unknown as Record<string, unknown>)[methodName] ===
    "function"
  );
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isBlockerFailure(check: OnboardingCheckResult): boolean {
  return check.severity === "blocker" && check.status === "fail";
}

function evaluateSmsSenderCheck(params: {
  config: KMsgCliConfig;
  provider: ProviderWithCapabilities;
}): OnboardingCheckResult | null {
  const { config, provider } = params;
  const entry = getProviderEntry(config, provider.id);
  if (!entry) return null;

  const providerConfig = getProviderConfig(config, provider.id);

  if (entry.type === "aligo") {
    const hasSender = hasNonEmptyString(providerConfig.sender);
    return {
      id: "sms_lms_sender_config",
      title: "SMS/LMS sender configuration",
      kind: "config",
      severity: "warning",
      status: hasSender ? "pass" : "fail",
      message: hasSender
        ? "aligo.config.sender is configured"
        : "SMS/LMS sender is not configured (set aligo.config.sender)",
      details: {
        requiredKeys: ["sender"],
      },
    };
  }

  if (entry.type === "iwinv") {
    const hasSenderNumber =
      hasNonEmptyString(providerConfig.senderNumber) ||
      hasNonEmptyString(providerConfig.smsSenderNumber);
    return {
      id: "sms_lms_sender_config",
      title: "SMS/LMS sender configuration",
      kind: "config",
      severity: "warning",
      status: hasSenderNumber ? "pass" : "fail",
      message: hasSenderNumber
        ? "iwinv sender number is configured"
        : "SMS/LMS sender is not configured (set iwinv.config.senderNumber or iwinv.config.smsSenderNumber)",
      details: {
        requiredAnyOf: ["senderNumber", "smsSenderNumber"],
      },
    };
  }

  return null;
}

async function runApiProbe(
  provider: ProviderWithCapabilities,
  operation: "list_templates" | "list_kakao_channels" | undefined,
  input?: {
    senderKey?: string;
    templateContext?: TemplateContext;
  },
): Promise<OnboardingCheckResult> {
  if (operation === "list_templates") {
    const fn = (provider as unknown as TemplateProvider).listTemplates;
    if (typeof fn !== "function") {
      return {
        id: "probe_list_templates",
        title: "Template list API probe",
        kind: "api_probe",
        severity: "warning",
        status: "skip",
        message: "listTemplates capability is not available",
      };
    }
    const result = await fn.call(
      provider,
      { page: 1, limit: 1 },
      input?.templateContext,
    );
    return result.isSuccess
      ? {
          id: "probe_list_templates",
          title: "Template list API probe",
          kind: "api_probe",
          severity: "warning",
          status: "pass",
          message: "Template list probe succeeded",
        }
      : {
          id: "probe_list_templates",
          title: "Template list API probe",
          kind: "api_probe",
          severity: "warning",
          status: "fail",
          message: result.error.message,
          details: { code: result.error.code },
        };
  }

  if (operation === "list_kakao_channels") {
    const fn = (provider as unknown as KakaoChannelProvider).listKakaoChannels;
    if (typeof fn !== "function") {
      return {
        id: "probe_list_kakao_channels",
        title: "Kakao channel list API probe",
        kind: "api_probe",
        severity: "warning",
        status: "skip",
        message: "listKakaoChannels capability is not available",
      };
    }
    const result = await fn.call(provider, {
      ...(hasNonEmptyString(input?.senderKey)
        ? { senderKey: input?.senderKey?.trim() }
        : {}),
    });
    return result.isSuccess
      ? {
          id: "probe_list_kakao_channels",
          title: "Kakao channel list API probe",
          kind: "api_probe",
          severity: "warning",
          status: "pass",
          message: "Kakao channel list probe succeeded",
        }
      : {
          id: "probe_list_kakao_channels",
          title: "Kakao channel list API probe",
          kind: "api_probe",
          severity: "warning",
          status: "fail",
          message: result.error.message,
          details: { code: result.error.code },
        };
  }

  return {
    id: "probe_unknown",
    title: "Unknown probe",
    kind: "api_probe",
    severity: "info",
    status: "skip",
    message: "Unknown probe operation",
  };
}

async function evaluateSpecChecks(params: {
  runtime: Runtime;
  provider: ProviderWithCapabilities;
  spec: ProviderOnboardingSpec;
  scope: ProviderOnboardingScope;
  senderKey?: string;
}): Promise<OnboardingCheckResult[]> {
  const { runtime, provider, spec, scope, senderKey } = params;
  const checks: OnboardingCheckResult[] = [];
  const providerConfig = getProviderConfig(runtime.config, provider.id);
  const templateContext: TemplateContext | undefined = hasNonEmptyString(
    senderKey,
  )
    ? { kakaoChannelSenderKey: senderKey?.trim() }
    : undefined;

  for (const check of spec.checks) {
    if (!supportsScope(check, scope)) continue;

    if (check.kind === "manual") {
      const state = getManualCheckState(runtime.config, provider.id, check.id);
      checks.push({
        id: check.id,
        title: check.title,
        kind: check.kind,
        severity: check.severity,
        status: state.done ? "pass" : "fail",
        message: state.done
          ? "Manual prerequisite is acknowledged"
          : "Manual prerequisite is not acknowledged",
        details: {
          done: state.done,
          ...(state.checkedAt ? { checkedAt: state.checkedAt } : {}),
          ...(state.note ? { note: state.note } : {}),
          ...(state.evidence ? { evidence: state.evidence } : {}),
        },
      });
      continue;
    }

    if (check.kind === "config") {
      const keys = Array.isArray(check.configKeys) ? check.configKeys : [];
      const missing = keys.filter((key) => {
        const value = getPathValue(providerConfig, key);
        return !hasNonEmptyString(value);
      });
      checks.push({
        id: check.id,
        title: check.title,
        kind: check.kind,
        severity: check.severity,
        status: missing.length === 0 ? "pass" : "fail",
        message:
          missing.length === 0
            ? "Required config keys are present"
            : `Missing config keys: ${missing.join(", ")}`,
        ...(missing.length > 0 ? { details: { missing } } : {}),
      });
      continue;
    }

    if (check.kind === "capability") {
      const methods = Array.isArray(check.capabilityMethods)
        ? check.capabilityMethods
        : [];
      const missing = methods.filter((name) => !hasCallable(provider, name));
      checks.push({
        id: check.id,
        title: check.title,
        kind: check.kind,
        severity: check.severity,
        status: missing.length === 0 ? "pass" : "fail",
        message:
          missing.length === 0
            ? "Required capabilities are available"
            : `Missing capabilities: ${missing.join(", ")}`,
        ...(missing.length > 0 ? { details: { missing } } : {}),
      });
      continue;
    }

    if (check.kind === "api_probe") {
      const probe = await runApiProbe(
        provider,
        check.probeOperation,
        hasNonEmptyString(senderKey)
          ? { senderKey, templateContext }
          : { templateContext },
      );
      checks.push({
        ...probe,
        id: check.id,
        title: check.title,
        severity: check.severity,
      });
      continue;
    }

    checks.push({
      id: check.id,
      title: check.title,
      kind: check.kind,
      severity: check.severity,
      status: "skip",
      message: "No evaluator implemented for this check kind",
    });
  }

  return checks;
}

async function inferPlusId(params: {
  provider: ProviderWithCapabilities;
  senderKey?: string;
}): Promise<{ plusId?: string; reason?: string }> {
  const { provider, senderKey } = params;
  const fn = (provider as unknown as KakaoChannelProvider).listKakaoChannels;
  if (typeof fn !== "function") {
    return { reason: "listKakaoChannels capability is unavailable" };
  }
  const senderKeyTrimmed =
    typeof senderKey === "string" ? senderKey.trim() : "";
  if (senderKeyTrimmed.length === 0) {
    return { reason: "senderKey is required to infer plusId" };
  }

  const result = await fn.call(provider, { senderKey: senderKeyTrimmed });
  if (result.isFailure) {
    return { reason: result.error.message };
  }

  const candidates = result.value.filter((channel) =>
    hasNonEmptyString(channel.plusId),
  );
  if (candidates.length !== 1) {
    return {
      reason:
        candidates.length === 0
          ? "no plusId found for senderKey"
          : "multiple plusId candidates found for senderKey",
    };
  }
  const candidate = candidates[0];
  return candidate?.plusId ? { plusId: candidate.plusId } : {};
}

export async function runProviderDoctor(input: {
  runtime: Runtime;
  provider: ProviderWithCapabilities;
}): Promise<ProviderDoctorResult> {
  const { runtime, provider } = input;
  const spec =
    typeof provider.getOnboardingSpec === "function"
      ? provider.getOnboardingSpec()
      : undefined;

  const checks: OnboardingCheckResult[] = [];
  const health = await provider.healthCheck();
  checks.push({
    id: "health_check",
    title: "Provider health check",
    kind: "api_probe",
    severity: "blocker",
    status: health.healthy ? "pass" : "fail",
    message: health.healthy
      ? "healthCheck returned healthy=true"
      : health.issues.join(", ") || "healthCheck reported unhealthy",
    details: {
      healthy: health.healthy,
      ...(typeof health.latencyMs === "number"
        ? { latencyMs: health.latencyMs }
        : {}),
      ...(health.data ? { data: health.data } : {}),
    },
  });

  if (spec) {
    checks.push(
      ...(await evaluateSpecChecks({
        runtime,
        provider,
        spec,
        scope: "doctor",
      })),
    );
  } else {
    checks.push({
      id: "onboarding_spec_missing",
      title: "Onboarding spec exists",
      kind: "config",
      severity: "warning",
      status: "fail",
      message: `Provider '${provider.id}' does not expose onboarding spec`,
    });
  }

  const smsSenderCheck = evaluateSmsSenderCheck({
    config: runtime.config,
    provider,
  });
  if (smsSenderCheck) {
    checks.push(smsSenderCheck);
  }

  const ok = !checks.some(isBlockerFailure);

  return {
    providerId: provider.id,
    providerName: provider.name,
    spec,
    checks,
    healthy: health.healthy,
    ok,
  };
}

export async function runAlimTalkPreflight(input: {
  runtime: Runtime;
  provider: ProviderWithCapabilities;
  senderKey?: string;
  plusId?: string;
  templateId: string;
}): Promise<AlimTalkPreflightResult> {
  const { runtime, provider, senderKey, plusId, templateId } = input;
  const spec =
    typeof provider.getOnboardingSpec === "function"
      ? provider.getOnboardingSpec()
      : undefined;
  const checks: OnboardingCheckResult[] = [];
  const templateContext: TemplateContext | undefined = hasNonEmptyString(
    senderKey,
  )
    ? { kakaoChannelSenderKey: senderKey?.trim() }
    : undefined;
  let inferredPlusId: string | undefined;

  if (spec) {
    checks.push(
      ...(await evaluateSpecChecks({
        runtime,
        provider,
        spec,
        scope: "preflight",
        senderKey,
      })),
    );

    const plusIdTrimmed = typeof plusId === "string" ? plusId.trim() : "";
    if (spec.plusIdPolicy === "optional") {
      checks.push({
        id: "plus_id_policy",
        title: "plusId policy",
        kind: "inference",
        severity: "info",
        status: "pass",
        message: "plusId is optional for this provider",
      });
    } else if (plusIdTrimmed.length > 0) {
      checks.push({
        id: "plus_id_policy",
        title: "plusId policy",
        kind: "inference",
        severity: "blocker",
        status: "pass",
        message: "plusId is provided",
      });
    } else if (spec.plusIdPolicy === "required") {
      checks.push({
        id: "plus_id_policy",
        title: "plusId policy",
        kind: "inference",
        severity: "blocker",
        status: "fail",
        message: "plusId is required for this provider",
      });
    } else if (spec.plusIdInference === "supported") {
      const inferred = await inferPlusId({ provider, senderKey });
      if (hasNonEmptyString(inferred.plusId)) {
        inferredPlusId = inferred.plusId?.trim();
        checks.push({
          id: "plus_id_policy",
          title: "plusId policy",
          kind: "inference",
          severity: "blocker",
          status: "pass",
          message: `plusId inferred from provider data (${inferredPlusId})`,
        });
      } else {
        checks.push({
          id: "plus_id_policy",
          title: "plusId policy",
          kind: "inference",
          severity: "blocker",
          status: "fail",
          message:
            inferred.reason ??
            "plusId is required when inference does not resolve a single channel",
        });
      }
    } else {
      checks.push({
        id: "plus_id_policy",
        title: "plusId policy",
        kind: "inference",
        severity: "blocker",
        status: "fail",
        message:
          "plusId is required because provider does not support plusId inference",
      });
    }
  } else {
    checks.push({
      id: "onboarding_spec_missing",
      title: "Onboarding spec exists",
      kind: "config",
      severity: "warning",
      status: "fail",
      message: `Provider '${provider.id}' does not expose onboarding spec`,
    });
  }

  const getTemplate = (provider as unknown as TemplateProvider).getTemplate;
  if (typeof getTemplate === "function") {
    const probe = await getTemplate.call(provider, templateId, templateContext);
    checks.push(
      probe.isSuccess
        ? {
            id: "template_exists_probe",
            title: "Template lookup probe",
            kind: "api_probe",
            severity: "blocker",
            status: "pass",
            message: `Template '${templateId}' is accessible`,
          }
        : {
            id: "template_exists_probe",
            title: "Template lookup probe",
            kind: "api_probe",
            severity: "blocker",
            status: "fail",
            message: probe.error.message,
            details: { code: probe.error.code },
          },
    );
  } else {
    checks.push({
      id: "template_exists_probe",
      title: "Template lookup probe",
      kind: "api_probe",
      severity: "warning",
      status: "skip",
      message: "Provider does not expose getTemplate capability",
    });
  }

  const ok = !checks.some(isBlockerFailure);

  return {
    providerId: provider.id,
    providerName: provider.name,
    spec,
    checks,
    ...(inferredPlusId ? { inferredPlusId } : {}),
    ok,
  };
}
