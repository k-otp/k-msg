import { fail, KMsgError, KMsgErrorCode, ok, type Result } from "@k-msg/core";
import { ButtonParser } from "../parser/button.parser";
import type { TemplateButton } from "../types/template.types";

const TEMPLATE_BUTTON_TYPES = new Set(["WL", "AL", "DS", "BK", "MD"]);

type TemplatePayload = {
  name?: unknown;
  content?: unknown;
  buttons?: unknown;
};

export type ValidateTemplatePayloadOptions = {
  requireName?: boolean;
  requireContent?: boolean;
};

export type NormalizedTemplatePayload = {
  name?: string;
  content?: string;
  buttons?: TemplateButton[];
};

function invalidRequest(message: string): KMsgError {
  return new KMsgError(KMsgErrorCode.INVALID_REQUEST, message);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function parseButtonsJson(value: string): Result<unknown, KMsgError> {
  try {
    return ok(JSON.parse(value));
  } catch (error) {
    return fail(
      invalidRequest(
        `Invalid JSON for buttons: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

function pickOptionalString(
  record: Record<string, unknown>,
  keys: string[],
  label: string,
): Result<string | undefined, KMsgError> {
  for (const key of keys) {
    if (!(key in record)) continue;
    const value = record[key];
    if (value === null || value === undefined || value === "") {
      return ok(undefined);
    }
    if (typeof value !== "string") {
      return fail(invalidRequest(`buttons.${label} must be a string`));
    }
    return ok(value);
  }
  return ok(undefined);
}

function normalizeButton(
  button: unknown,
  index: number,
): Result<TemplateButton, KMsgError> {
  const record = asRecord(button);
  if (!record) {
    return fail(
      invalidRequest(`buttons[${index}] must be an object with type/name`),
    );
  }

  const type = record.type;
  if (typeof type !== "string" || !TEMPLATE_BUTTON_TYPES.has(type)) {
    return fail(
      invalidRequest(
        `buttons[${index}].type must be one of WL, AL, DS, BK, MD`,
      ),
    );
  }
  const buttonType = type as TemplateButton["type"];

  const name = record.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    return fail(invalidRequest(`buttons[${index}].name is required`));
  }

  const linkMobile = pickOptionalString(
    record,
    ["linkMobile", "url_mobile", "urlMobile"],
    "linkMobile",
  );
  if (linkMobile.isFailure) return linkMobile;

  const linkPc = pickOptionalString(
    record,
    ["linkPc", "url_pc", "urlPc"],
    "linkPc",
  );
  if (linkPc.isFailure) return linkPc;

  const linkIos = pickOptionalString(
    record,
    ["linkIos", "url_ios", "urlIos"],
    "linkIos",
  );
  if (linkIos.isFailure) return linkIos;

  const linkAndroid = pickOptionalString(
    record,
    ["linkAndroid", "url_android", "urlAndroid"],
    "linkAndroid",
  );
  if (linkAndroid.isFailure) return linkAndroid;

  const schemeIos = pickOptionalString(
    record,
    ["schemeIos", "scheme_ios"],
    "schemeIos",
  );
  if (schemeIos.isFailure) return schemeIos;

  const schemeAndroid = pickOptionalString(
    record,
    ["schemeAndroid", "scheme_android"],
    "schemeAndroid",
  );
  if (schemeAndroid.isFailure) return schemeAndroid;

  return ok({
    type: buttonType,
    name,
    ...(linkMobile.value ? { linkMobile: linkMobile.value } : {}),
    ...(linkPc.value ? { linkPc: linkPc.value } : {}),
    ...(linkIos.value ? { linkIos: linkIos.value } : {}),
    ...(linkAndroid.value ? { linkAndroid: linkAndroid.value } : {}),
    ...(schemeIos.value ? { schemeIos: schemeIos.value } : {}),
    ...(schemeAndroid.value ? { schemeAndroid: schemeAndroid.value } : {}),
  });
}

export function parseTemplateButtons(
  value: unknown,
): Result<TemplateButton[] | undefined, KMsgError> {
  if (value === undefined || value === null) {
    return ok(undefined);
  }

  let normalized: unknown = value;
  if (typeof normalized === "string") {
    const parsed = parseButtonsJson(normalized);
    if (parsed.isFailure) return parsed;
    normalized = parsed.value;
  }

  const record = asRecord(normalized);
  if (record && Array.isArray(record.button)) {
    normalized = record.button;
  }

  if (!Array.isArray(normalized)) {
    return fail(invalidRequest("buttons must be a JSON array"));
  }

  const parsedButtons: TemplateButton[] = [];
  for (const [index, button] of normalized.entries()) {
    const normalizedButton = normalizeButton(button, index);
    if (normalizedButton.isFailure) return normalizedButton;
    parsedButtons.push(normalizedButton.value);
  }

  const validation = ButtonParser.validateButtons(parsedButtons);
  if (!validation.isValid) {
    return fail(
      invalidRequest(
        `Invalid template buttons: ${validation.errors.join(", ")}`,
      ),
    );
  }

  return ok(parsedButtons);
}

export function validateTemplatePayload(
  payload: TemplatePayload,
  options: ValidateTemplatePayloadOptions = {},
): Result<NormalizedTemplatePayload, KMsgError> {
  const requireName = options.requireName ?? true;
  const requireContent = options.requireContent ?? true;

  const normalized: NormalizedTemplatePayload = {};

  if (payload.name === undefined || payload.name === null) {
    if (requireName) {
      return fail(invalidRequest("name is required"));
    }
  } else if (
    typeof payload.name !== "string" ||
    payload.name.trim().length === 0
  ) {
    return fail(
      invalidRequest(
        requireName ? "name is required" : "name must be a non-empty string",
      ),
    );
  } else {
    normalized.name = payload.name.trim();
  }

  if (payload.content === undefined || payload.content === null) {
    if (requireContent) {
      return fail(invalidRequest("content is required"));
    }
  } else if (
    typeof payload.content !== "string" ||
    payload.content.trim().length === 0
  ) {
    return fail(
      invalidRequest(
        requireContent
          ? "content is required"
          : "content must be a non-empty string",
      ),
    );
  } else {
    normalized.content = payload.content;
  }

  const buttons = parseTemplateButtons(payload.buttons);
  if (buttons.isFailure) return buttons;
  if (buttons.value !== undefined) {
    normalized.buttons = buttons.value;
  }

  return ok(normalized);
}
