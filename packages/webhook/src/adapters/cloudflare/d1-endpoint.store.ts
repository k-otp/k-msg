import type { WebhookEndpointStore } from "../../runtime/types";
import type { WebhookEndpoint } from "../../types/webhook.types";
import {
  type D1DatabaseLike,
  type D1Row,
  queryAll,
  queryFirst,
  runStatement,
  safeJsonParse,
  toDate,
  toNumber,
  toStringValue,
} from "./d1-client";

interface EndpointRow extends D1Row {
  id?: unknown;
  url?: unknown;
  name?: unknown;
  description?: unknown;
  active?: unknown;
  events_json?: unknown;
  headers_json?: unknown;
  secret?: unknown;
  retry_config_json?: unknown;
  filters_json?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  last_triggered_at?: unknown;
  status?: unknown;
}

export class D1WebhookEndpointStore implements WebhookEndpointStore {
  constructor(
    private readonly db: D1DatabaseLike,
    private readonly tableName: string,
    private readonly ensureInitialized: () => Promise<void>,
  ) {}

  async add(endpoint: WebhookEndpoint): Promise<void> {
    await this.ensureInitialized();

    await runStatement(
      this.db,
      `INSERT OR REPLACE INTO ${this.tableName} (
        id, url, name, description, active, events_json, headers_json, secret,
        retry_config_json, filters_json, created_at, updated_at, last_triggered_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        endpoint.id,
        endpoint.url,
        endpoint.name ?? null,
        endpoint.description ?? null,
        endpoint.active ? 1 : 0,
        JSON.stringify(endpoint.events),
        endpoint.headers ? JSON.stringify(endpoint.headers) : null,
        endpoint.secret ?? null,
        endpoint.retryConfig ? JSON.stringify(endpoint.retryConfig) : null,
        endpoint.filters ? JSON.stringify(endpoint.filters) : null,
        endpoint.createdAt.getTime(),
        endpoint.updatedAt.getTime(),
        endpoint.lastTriggeredAt ? endpoint.lastTriggeredAt.getTime() : null,
        endpoint.status,
      ],
    );
  }

  async update(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
    await this.ensureInitialized();

    const existing = await this.get(endpointId);
    if (!existing) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }

    await this.add(endpoint);
  }

  async remove(endpointId: string): Promise<void> {
    await this.ensureInitialized();
    await runStatement(this.db, `DELETE FROM ${this.tableName} WHERE id = ?`, [
      endpointId,
    ]);
  }

  async get(endpointId: string): Promise<WebhookEndpoint | null> {
    await this.ensureInitialized();

    const row = await queryFirst<EndpointRow>(
      this.db,
      `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      [endpointId],
    );

    return row ? this.toEndpoint(row) : null;
  }

  async list(): Promise<WebhookEndpoint[]> {
    await this.ensureInitialized();

    const rows = await queryAll<EndpointRow>(
      this.db,
      `SELECT * FROM ${this.tableName} ORDER BY updated_at DESC`,
    );

    return rows.map((row) => this.toEndpoint(row));
  }

  private toEndpoint(row: EndpointRow): WebhookEndpoint {
    const createdAt = toDate(row.created_at) ?? new Date();
    const updatedAt = toDate(row.updated_at) ?? createdAt;
    const lastTriggeredAt = toDate(row.last_triggered_at);
    const status = toStringValue(row.status, "inactive");

    return {
      id: toStringValue(row.id),
      url: toStringValue(row.url),
      name: toStringValue(row.name, "") || undefined,
      description: toStringValue(row.description, "") || undefined,
      active: toNumber(row.active, 0) > 0,
      events: safeJsonParse<WebhookEndpoint["events"]>(row.events_json) ?? [],
      headers:
        safeJsonParse<WebhookEndpoint["headers"]>(row.headers_json) ??
        undefined,
      secret: toStringValue(row.secret, "") || undefined,
      retryConfig:
        safeJsonParse<WebhookEndpoint["retryConfig"]>(row.retry_config_json) ??
        undefined,
      filters:
        safeJsonParse<WebhookEndpoint["filters"]>(row.filters_json) ??
        undefined,
      createdAt,
      updatedAt,
      lastTriggeredAt,
      status:
        status === "active" ||
        status === "inactive" ||
        status === "error" ||
        status === "suspended"
          ? status
          : "inactive",
    };
  }
}
