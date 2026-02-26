import {
  fail,
  isKMsgMessageType,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  type MessageVariables,
  ok,
  type Result,
  type SendInput,
} from "@k-msg/core";

export type BuildSendInputValidationMode = "safe" | "unsafe_passthrough";

export interface BuildSendInputIssue {
  code: string;
  message: string;
  path: string;
}

export interface BuildSendInputOptions {
  validationMode?: BuildSendInputValidationMode;
}

export interface SendInputEnvelope {
  requestId?: string;
  correlationId?: string;
  providerOptions?: Record<string, unknown>;
}

export interface SendInputJobPayload {
  type?: MessageType | string;
  to?: string;
  from?: string;
  text?: string;
  templateId?: string;
  variables?: MessageVariables;
  providerId?: string;
  providerOptions?: Record<string, unknown>;
}

export interface BuildSendInputDetailedResult {
  result: Result<SendInput, KMsgError>;
  issues: BuildSendInputIssue[];
  mode: BuildSendInputValidationMode;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeAttempt(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : undefined;
}

function toMode(
  value: BuildSendInputValidationMode | undefined,
): BuildSendInputValidationMode {
  return value === "unsafe_passthrough" ? value : "safe";
}

function pushIssue(
  issues: BuildSendInputIssue[],
  code: string,
  message: string,
  path: string,
) {
  issues.push({ code, message, path });
}

export function buildSendInputFromJob(
  job: SendInputJobPayload,
  envelope: SendInputEnvelope,
  attempt: number,
  options: BuildSendInputOptions = {},
): Result<SendInput, KMsgError> {
  return buildSendInputFromJobDetailed(job, envelope, attempt, options).result;
}

export function buildSendInputFromJobDetailed(
  job: SendInputJobPayload,
  envelope: SendInputEnvelope,
  attempt: number,
  options: BuildSendInputOptions = {},
): BuildSendInputDetailedResult {
  const mode = toMode(options.validationMode);
  const issues: BuildSendInputIssue[] = [];

  const rawType = normalizeString(job.type);
  const resolvedType: MessageType = (() => {
    if (!rawType) return "ALIMTALK";
    if (isKMsgMessageType(rawType)) return rawType;
    pushIssue(
      issues,
      "unknown_type",
      `Unsupported message type: ${rawType}`,
      "type",
    );
    return "ALIMTALK";
  })();

  const to = normalizeString(job.to);
  if (!to) {
    pushIssue(issues, "missing_to", "`to` is required", "to");
  }

  const from = normalizeString(job.from);
  const text = normalizeString(job.text);
  const templateId = normalizeString(job.templateId);
  const providerId = normalizeString(job.providerId);

  if (resolvedType === "ALIMTALK" && !templateId) {
    pushIssue(
      issues,
      "missing_template_id",
      "ALIMTALK requires `templateId`",
      "templateId",
    );
  }

  if ((resolvedType === "SMS" || resolvedType === "LMS") && !text) {
    pushIssue(
      issues,
      "missing_text",
      `${resolvedType} requires \`text\``,
      "text",
    );
  }

  const providerOptions: Record<string, unknown> = {};
  if (isObjectRecord(envelope.providerOptions)) {
    Object.assign(providerOptions, envelope.providerOptions);
  }
  if (isObjectRecord(job.providerOptions)) {
    Object.assign(providerOptions, job.providerOptions);
  }

  const requestIdFromJob = isObjectRecord(job.providerOptions)
    ? normalizeString(job.providerOptions.requestId)
    : undefined;
  const requestIdFromEnvelope = normalizeString(envelope.requestId);
  const requestId = requestIdFromJob ?? requestIdFromEnvelope;
  if (requestId) {
    providerOptions.requestId = requestId;
  }

  const correlationIdFromJob = isObjectRecord(job.providerOptions)
    ? normalizeString(job.providerOptions.correlationId)
    : undefined;
  const correlationIdFromEnvelope = normalizeString(envelope.correlationId);
  const correlationId = correlationIdFromJob ?? correlationIdFromEnvelope;
  if (correlationId) {
    providerOptions.correlationId = correlationId;
  }

  const normalizedAttempt = normalizeAttempt(attempt);
  if (normalizedAttempt === undefined) {
    pushIssue(
      issues,
      "invalid_attempt",
      "`attempt` must be a positive finite number",
      "attempt",
    );
  } else {
    providerOptions.attempt = normalizedAttempt;
  }

  const variables = isObjectRecord(job.variables)
    ? (job.variables as MessageVariables)
    : undefined;

  const resultInput: SendInput = {
    type: resolvedType,
    to: to ?? "",
    ...(from ? { from } : {}),
    ...(templateId ? { templateId } : {}),
    ...(text ? { text } : {}),
    ...(providerId ? { providerId } : {}),
    ...(variables ? { variables } : {}),
    ...(Object.keys(providerOptions).length > 0 ? { providerOptions } : {}),
  } as SendInput;

  if (issues.length > 0 && mode === "safe") {
    const first = issues[0];
    return {
      result: fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, first.message, {
          issues,
          mode,
        }),
      ),
      issues,
      mode,
    };
  }

  return {
    result: ok(resultInput),
    issues,
    mode,
  };
}
