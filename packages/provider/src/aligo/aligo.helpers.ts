/**
 * Backward-compatible helper barrel.
 *
 * New code should import from:
 * - ./aligo.shared.helpers (send/channel/common)
 * - ./aligo.template.helpers (template-only)
 */

export * from "./aligo.shared.helpers";
export * from "./aligo.template.helpers";
