import type { WebhookEndpoint, WebhookEvent } from "../types/webhook.types";

function matchesFilterValue(
  accepted: readonly string[] | undefined,
  value: string | undefined,
): boolean {
  if (!accepted || accepted.length === 0) {
    return true;
  }

  if (!value) {
    return false;
  }

  return accepted.includes(value);
}

export function endpointMatchesEvent(
  endpoint: WebhookEndpoint,
  event: WebhookEvent,
): boolean {
  if (!endpoint.active || endpoint.status !== "active") {
    return false;
  }

  if (!endpoint.events.includes(event.type)) {
    return false;
  }

  const filters = endpoint.filters;
  if (!filters) {
    return true;
  }

  if (!matchesFilterValue(filters.providerId, event.metadata.providerId)) {
    return false;
  }

  if (!matchesFilterValue(filters.channelId, event.metadata.channelId)) {
    return false;
  }

  if (!matchesFilterValue(filters.templateId, event.metadata.templateId)) {
    return false;
  }

  return true;
}
