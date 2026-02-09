/**
 * Interpolates variables into a string using the #{key} syntax.
 *
 * @param text The string to interpolate
 * @param vars A record of key-value pairs to replace
 * @returns The interpolated string
 */
export function interpolate(text: string, vars: Record<string, any>): string {
  if (!text) return '';
  if (!vars) return text;

  return text.replace(/#\{([^}]+)\}/g, (match, key) => {
    const value = vars[key];
    
    // If value is undefined or null, leave the token as-is
    if (value === undefined || value === null) {
      return match;
    }
    
    return String(value);
  });
}
