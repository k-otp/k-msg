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
  nextAction?: string;
  reason?: string;
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

type PlusIdInferenceFailureCode =
  | "ambiguous_candidates"
  | "capability_unavailable"
  | "no_candidate"
  | "provider_error"
  | "sender_key_missing";

type PlusIdInferenceResult =
  | { plusId: string }
  | {
      message: string;
      reasonCode: PlusIdInferenceFailureCode;
    };

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

function withGuidance(input: {
  check: OnboardingCheckResult;
  providerId: string;
  providerName: string;
  scope: ProviderOnboardingScope;
  spec?: ProviderOnboardingSpec;
}): OnboardingCheckResult {
  const { check, providerId, providerName, scope, spec } = input;
  const providerKind = spec?.providerId ?? providerId;
  const guidance =
    check.id === "health_check"
      ? getHealthCheckGuidance(check, providerName)
      : check.id === "channel_registered_in_console"
        ? getManualChannelGuidance(check, providerName, providerKind)
        : check.id === "plus_id_policy"
          ? getPlusIdGuidance(check, providerName, providerKind)
          : check.id === "template_exists_probe"
            ? getTemplateProbeGuidance(check, providerName, scope)
            : check.id === "sms_lms_sender_config"
              ? getSmsSenderGuidance(check, providerKind)
              : getGenericCheckGuidance(check, providerName, providerKind);

  return guidance ? { ...check, ...guidance } : check;
}

function getHealthCheckGuidance(
  check: OnboardingCheckResult,
  providerName: string,
): Pick<OnboardingCheckResult, "nextAction" | "reason"> {
  if (check.status === "pass") {
    return {
      reason: `${providerName} runtime health probe completed successfully.`,
      nextAction: "Continue with provider-specific readiness checks below.",
    };
  }

  return {
    reason: `${providerName} healthCheck reported an unhealthy runtime or upstream dependency path.`,
    nextAction:
      "Verify credentials, network/IP allowlists, and vendor service status before retrying doctor or send.",
  };
}

function getManualChannelGuidance(
  check: OnboardingCheckResult,
  providerName: string,
  providerKind: string,
): Pick<OnboardingCheckResult, "nextAction" | "reason"> {
  const basePath = `onboarding.manualChecks.${providerKind}.channel_registered_in_console`;
  if (check.status === "pass") {
    return {
      reason: `${providerName} requires a vendor-side channel approval step, and a manual evidence record is already stored.`,
      nextAction: `Keep ${basePath} note/evidence current when the vendor console approval changes.`,
    };
  }

  return {
    reason: `${providerName} still depends on a vendor console prerequisite outside the CLI runtime.`,
    nextAction: `Finish the vendor console approval, then set ${basePath}.done=true and store note/evidence.`,
  };
}

function getPlusIdGuidance(
  check: OnboardingCheckResult,
  providerName: string,
  providerKind: string,
): Pick<OnboardingCheckResult, "nextAction" | "reason"> {
  const reasonCode = check.details?.reasonCode;

  if (check.status === "pass" && check.message.includes("optional")) {
    return {
      reason: `${providerName} does not require plusId for this send path.`,
      nextAction:
        "You can still persist plusId in a Kakao channel alias when you want deterministic routing.",
    };
  }

  if (check.status === "pass" && check.message.includes("inferred")) {
    return {
      reason: `${providerName} returned a single plusId candidate for the current senderKey.`,
      nextAction:
        "Persist that plusId in aliases/defaults if you want to avoid future inference ambiguity.",
    };
  }

  if (check.status === "pass") {
    return {
      reason: `${providerName} received an explicit plusId for this preflight.`,
      nextAction:
        "Re-use the same plusId through a channel alias or defaults when this route is stable.",
    };
  }

  switch (reasonCode) {
    case "sender_key_missing":
      return {
        reason: "plusId inference could not start because senderKey/profileId was not resolved.",
        nextAction:
          "Pass --sender-key, choose a Kakao channel alias, or configure a provider/default senderKey first.",
      };
    case "no_candidate":
      return {
        reason: `${providerName} returned no plusId candidate for the resolved senderKey.`,
        nextAction:
          "Confirm the approved Kakao channel exists for that senderKey, or set --plus-id / alias.plusId explicitly.",
      };
    case "ambiguous_candidates":
      return {
        reason: `${providerName} returned multiple plusId candidates for the resolved senderKey.`,
        nextAction:
          "Set --plus-id explicitly or create a provider-scoped Kakao channel alias with senderKey and plusId.",
      };
    case "capability_unavailable":
      return {
        reason: `${providerName} does not expose plusId inference for this integration.`,
        nextAction:
          "Set --plus-id directly or persist plusId in defaults/aliases before re-running preflight.",
      };
    case "provider_error":
      return {
        reason: `${providerName} failed while probing plusId candidates from provider data.`,
        nextAction:
          "Check provider credentials and channel visibility, then retry preflight or set plusId explicitly.",
      };
    default:
      return {
        reason: `${providerName} requires an explicit plusId on this path because inference is unavailable or unresolved.`,
        nextAction:
          providerKind === "solapi"
            ? "Set --plus-id or configure aliases/defaults.kakao.plusId together with the pfId/profileId binding."
            : "Set --plus-id or configure a Kakao channel alias/default plusId before retrying.",
      };
  }
}

function getTemplateProbeGuidance(
  check: OnboardingCheckResult,
  providerName: string,
  scope: ProviderOnboardingScope,
): Pick<OnboardingCheckResult, "nextAction" | "reason"> {
  if (check.status === "pass") {
    return {
      reason: `${providerName} confirmed that the target template is reachable with the current provider context.`,
      nextAction:
        scope === "preflight"
          ? "You can proceed to send once the remaining blocker checks are green."
          : "Use preflight/send with the same template context when you are ready to deliver messages.",
    };
  }

  if (check.status === "skip") {
    return {
      reason: `${providerName} does not expose a template lookup capability through this integration.`,
      nextAction:
        "Validate the template through vendor console/API outside the CLI before sending live traffic.",
    };
  }

  return {
    reason: `${providerName} could not confirm template accessibility for the requested template ID.`,
    nextAction:
      "Verify template ID, senderKey/profileId context, and vendor approval state, then re-run preflight.",
  };
}

function getSmsSenderGuidance(
  check: OnboardingCheckResult,
  providerKind: string,
): Pick<OnboardingCheckResult, "nextAction" | "reason"> {
  if (check.status === "pass") {
    return {
      reason: "A provider-level SMS/LMS sender fallback is already configured.",
      nextAction:
        "You can still override the sender per command with --from when an explicit callback number is needed.",
    };
  }

  return {
    reason: "SMS/LMS fallback sender config is missing, so sends will depend on per-command --from values.",
    nextAction:
      providerKind === "aligo"
        ? "Set aligo.config.sender (prefer env:ALIGO_SENDER) or pass --from on send."
        : "Set iwinv.config.senderNumber or iwinv.config.smsSenderNumber, or pass --from on send.",
  };
}

function getGenericCheckGuidance(
  check: OnboardingCheckResult,
  providerName: string,
  providerKind: string,
): Pick<OnboardingCheckResult, "nextAction" | "reason"> | undefined {
  if (check.kind === "config") {
    const missing = Array.isArray(check.details?.missing)
      ? (check.details?.missing as string[])
      : [];
    if (check.status === "pass") {
      return {
        reason: `${providerName} has the config keys required for this readiness check.`,
        nextAction:
          "Keep those values in env:-backed config entries so doctor and preflight stay reproducible across environments.",
      };
    }
    return {
      reason: `${providerName} is missing required config input for this readiness check.`,
      nextAction:
        missing.length > 0
          ? `Populate ${missing.join(", ")} for ${providerKind}, preferably through env: references, then re-run doctor/preflight.`
          : `Fill the required ${providerKind} config values, preferably through env: references, then re-run doctor/preflight.`,
    };
  }

  if (check.kind === "capability") {
    const missing = Array.isArray(check.details?.missing)
      ? (check.details?.missing as string[])
      : [];
    if (check.status === "pass") {
      return {
        reason: `${providerName} exposes the provider capabilities needed for this workflow.`,
        nextAction:
          "Proceed with API probes or send flows that depend on those capabilities.",
      };
    }
    return {
      reason: `${providerName} does not expose every capability this workflow expects.`,
      nextAction:
        missing.length > 0
          ? `Missing capabilities: ${missing.join(", ")}. Fall back to the vendor manual path or upgrade the provider integration before relying on this flow.`
          : "Fall back to the vendor manual path or upgrade the provider integration before relying on this flow.",
    };
  }

  if (check.kind === "api_probe") {
    if (check.status === "pass") {
      return {
        reason: `${providerName} responded successfully to the readiness probe.`,
        nextAction: "Use the same credentials and routing context for live preflight/send.",
      };
    }
    if (check.status === "skip") {
      return {
        reason: `${providerName} does not expose this probe capability in the current integration.`,
        nextAction:
          "Rely on vendor console/API validation outside the CLI for this prerequisite.",
      };
    }
    return {
      reason: `${providerName} failed a provider-side readiness probe.`,
      nextAction:
        "Check credentials, IP allowlists, account state, and vendor-side resource visibility before retrying.",
    };
  }

  return undefined;
}

export function formatOnboardingCheckLines(
  check: OnboardingCheckResult,
  indent = "",
): string[] {
  const marker =
    check.status === "pass"
      ? "PASS"
      : check.status === "fail"
        ? "FAIL"
        : "SKIP";
  const lines = [
    `${indent}[${marker}] (${check.severity}) ${check.id}: ${check.message}`,
  ];

  if (check.reason) {
    lines.push(`${indent}  reason: ${check.reason}`);
  }
  if (check.nextAction) {
    lines.push(`${indent}  next: ${check.nextAction}`);
  }

  return lines;
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
}): Promise<PlusIdInferenceResult> {
  const { provider, senderKey } = params;
  const fn = (provider as unknown as KakaoChannelProvider).listKakaoChannels;
  if (typeof fn !== "function") {
    return {
      message: "plusId inference is unavailable because listKakaoChannels is not exposed",
      reasonCode: "capability_unavailable",
    };
  }
  const senderKeyTrimmed =
    typeof senderKey === "string" ? senderKey.trim() : "";
  if (senderKeyTrimmed.length === 0) {
    return {
      message: "senderKey is required to infer plusId",
      reasonCode: "sender_key_missing",
    };
  }

  const result = await fn.call(provider, { senderKey: senderKeyTrimmed });
  if (result.isFailure) {
    return {
      message: result.error.message,
      reasonCode: "provider_error",
    };
  }

  const candidates = result.value.filter((channel) =>
    hasNonEmptyString(channel.plusId),
  );
  if (candidates.length !== 1) {
    return {
      message:
        candidates.length === 0
          ? "no plusId found for senderKey"
          : "multiple plusId candidates found for senderKey",
      reasonCode:
        candidates.length === 0 ? "no_candidate" : "ambiguous_candidates",
    };
  }
  const candidate = candidates[0];
  return candidate?.plusId
    ? { plusId: candidate.plusId }
    : {
        message: "no plusId found for senderKey",
        reasonCode: "no_candidate",
      };
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
  const enrichedChecks = checks.map((check) =>
    withGuidance({
      check,
      providerId: provider.id,
      providerName: provider.name,
      scope: "doctor",
      spec,
    }),
  );

  return {
    providerId: provider.id,
    providerName: provider.name,
    spec,
    checks: enrichedChecks,
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
      if ("plusId" in inferred) {
        inferredPlusId = inferred.plusId.trim();
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
            inferred.message ??
            "plusId is required when inference does not resolve a single channel",
          details: {
            reasonCode: inferred.reasonCode,
          },
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
  const enrichedChecks = checks.map((check) =>
    withGuidance({
      check,
      providerId: provider.id,
      providerName: provider.name,
      scope: "preflight",
      spec,
    }),
  );

  return {
    providerId: provider.id,
    providerName: provider.name,
    spec,
    checks: enrichedChecks,
    ...(inferredPlusId ? { inferredPlusId } : {}),
    ok,
  };
}
