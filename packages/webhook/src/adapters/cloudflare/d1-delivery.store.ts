import type {
  WebhookDeliveryListOptions,
  WebhookDeliveryStore,
} from "../../runtime/types";
import {
  type WebhookDelivery,
  WebhookEventType,
} from "../../types/webhook.types";
import {
  type D1DatabaseLike,
  type D1Row,
  queryAll,
  runStatement,
  safeJsonParse,
  toDate,
  toStringValue,
} from "./d1-client";

interface DeliveryRow extends D1Row {
  id?: unknown;
  endpoint_id?: unknown;
  event_id?: unknown;
  event_type?: unknown;
  url?: unknown;
  http_method?: unknown;
  headers_json?: unknown;
  payload?: unknown;
  attempts_json?: unknown;
  status?: unknown;
  created_at?: unknown;
  completed_at?: unknown;
  next_retry_at?: unknown;
}

const WEBHOOK_EVENT_TYPES = new Set<string>(Object.values(WebhookEventType));

function toWebhookEventType(value: unknown): WebhookEventType | undefined {
  const normalized = toStringValue(value, "");
  return WEBHOOK_EVENT_TYPES.has(normalized)
    ? (normalized as WebhookEventType)
    : undefined;
}

export class D1WebhookDeliveryStore implements WebhookDeliveryStore {
  constructor(
    private readonly db: D1DatabaseLike,
    private readonly tableName: string,
    private readonly ensureInitialized: () => Promise<void>,
  ) {}

  async add(delivery: WebhookDelivery): Promise<void> {
    await this.ensureInitialized();

    await runStatement(
      this.db,
      `INSERT OR REPLACE INTO ${this.tableName} (
        id, endpoint_id, event_id, event_type, url, http_method, headers_json,
        payload, attempts_json, status, created_at, completed_at, next_retry_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        delivery.id,
        delivery.endpointId,
        delivery.eventId,
        delivery.eventType ?? null,
        delivery.url,
        delivery.httpMethod,
        JSON.stringify(delivery.headers),
        delivery.payload,
        JSON.stringify(delivery.attempts),
        delivery.status,
        delivery.createdAt.getTime(),
        delivery.completedAt ? delivery.completedAt.getTime() : null,
        delivery.nextRetryAt ? delivery.nextRetryAt.getTime() : null,
      ],
    );
  }

  async list(
    options: WebhookDeliveryListOptions = {},
  ): Promise<WebhookDelivery[]> {
    await this.ensureInitialized();

    const where: string[] = [];
    const params: unknown[] = [];

    if (options.endpointId) {
      where.push("endpoint_id = ?");
      params.push(options.endpointId);
    }

    if (options.eventType) {
      where.push("event_type = ?");
      params.push(options.eventType);
    }

    if (options.status) {
      where.push("status = ?");
      params.push(options.status);
    }

    const limit =
      typeof options.limit === "number" && Number.isFinite(options.limit)
        ? Math.max(0, Math.floor(options.limit))
        : 100;

    params.push(limit);

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await queryAll<DeliveryRow>(
      this.db,
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY created_at DESC LIMIT ?`,
      params,
    );

    return rows.map((row) => this.toDelivery(row));
  }

  private toDelivery(row: DeliveryRow): WebhookDelivery {
    const createdAt = toDate(row.created_at) ?? new Date();
    const completedAt = toDate(row.completed_at);
    const nextRetryAt = toDate(row.next_retry_at);
    const status = toStringValue(row.status, "pending");

    return {
      id: toStringValue(row.id),
      endpointId: toStringValue(row.endpoint_id),
      eventId: toStringValue(row.event_id),
      eventType: toWebhookEventType(row.event_type),
      url: toStringValue(row.url),
      httpMethod: ["POST", "PUT", "PATCH"].includes(
        toStringValue(row.http_method, "POST"),
      )
        ? (toStringValue(
            row.http_method,
            "POST",
          ) as WebhookDelivery["httpMethod"])
        : "POST",
      headers:
        safeJsonParse<WebhookDelivery["headers"]>(row.headers_json) ?? {},
      payload: toStringValue(row.payload, "{}"),
      attempts:
        safeJsonParse<WebhookDelivery["attempts"]>(row.attempts_json)?.map(
          (attempt) => ({
            ...attempt,
            timestamp: toDate(attempt.timestamp) ?? new Date(),
          }),
        ) ?? [],
      status:
        status === "pending" ||
        status === "success" ||
        status === "failed" ||
        status === "exhausted"
          ? status
          : "pending",
      createdAt,
      completedAt,
      nextRetryAt,
    };
  }
}
