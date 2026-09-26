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

/** Placeholder names that `variables` has no key for, each listed once. */
export function findMissingTemplateVariables(
  placeholders: readonly string[],
  variables: Readonly<Record<string, unknown>>,
): string[] {
  const missing = placeholders.filter(
    (name) => !Object.prototype.hasOwnProperty.call(variables, name),
  );
  return [...new Set(missing)];
}
