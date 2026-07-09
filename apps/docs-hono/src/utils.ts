export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function escapeScriptString(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("</", "<\\/")
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029")
    .replaceAll("'", "\\'");
}
