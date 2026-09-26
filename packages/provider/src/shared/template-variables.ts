const PLACEHOLDER_PATTERN = /#\{([^}]+)\}/g;

/**
 * Lists a template's `#{name}` placeholders in the order they appear, once
 * per occurrence, with surrounding whitespace trimmed.
 */
export function listTemplatePlaceholders(content: string): string[] {
  return Array.from(content.matchAll(PLACEHOLDER_PATTERN), (match) =>
    (match[1] ?? "").trim(),
  );
}

/** Replaces every `#{name}` with `variables[name]`; null or undefined become "". */
export function fillTemplatePlaceholders(
  content: string,
  variables: Readonly<Record<string, unknown>>,
): string {
  return content.replace(PLACEHOLDER_PATTERN, (_match, name: string) => {
    const value = variables[name.trim()];
    return value === null || value === undefined ? "" : String(value);
  });
}

/**
 * Placeholder names that `variables` has no value for, each listed once. A key
 * set to `undefined` counts as missing, as it would after a JSON round trip
 * (a queued send); `null` is an explicit empty value.
 */
export function findMissingTemplateVariables(
  placeholders: readonly string[],
  variables: Readonly<Record<string, unknown>>,
): string[] {
  const missing = placeholders.filter(
    (name) =>
      !Object.prototype.hasOwnProperty.call(variables, name) ||
      variables[name] === undefined,
  );
  return [...new Set(missing)];
}
