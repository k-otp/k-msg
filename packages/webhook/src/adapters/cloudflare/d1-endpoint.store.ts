import { WebhookEndpointConflictError } from "../../runtime/errors";
import type { WebhookEndpointStore } from "../../runtime/types";
import type { WebhookEndpoint } from "../../types/webhook.types";
import {
  changedRows,
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

// Every column except id, in the order toColumnValues() returns them.
const ENDPOINT_COLUMNS = [
  "url",
  "name",
  "description",
  "active",
  "events_json",
  "headers_json",
  "secret",
  "retry_config_json",
  "filters_json",
  "created_at",
  "updated_at",
  "last_triggered_at",
  "status",
] as const;

function toColumnValues(endpoint: WebhookEndpoint): unknown[] {
  return [
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
  ];
}

export class D1WebhookEndpointStore implements WebhookEndpointStore {
  constructor(
    private readonly db: D1DatabaseLike,
    private readonly tableName: string,
    private readonly ensureInitialized: () => Promise<void>,
  ) {}

  async add(endpoint: WebhookEndpoint): Promise<void> {
    await this.ensureInitialized();

    try {
      await runStatement(
        this.db,
        `INSERT INTO ${this.tableName} (id, ${ENDPOINT_COLUMNS.join(", ")})
        VALUES (?, ${ENDPOINT_COLUMNS.map(() => "?").join(", ")})`,
        [endpoint.id, ...toColumnValues(endpoint)],
      );
    } catch (error) {
      // The primary key and the unique url index reject a duplicate; say
      // which stored endpoint holds the id or URL. If that lookup fails too,
      // the original error is the better report.
      const conflict = await this.findConflict(endpoint).catch(() => undefined);
      throw conflict ?? error;
    }
  }

  async update(endpointId: string, endpoint: WebhookEndpoint): Promise<void> {
    await this.ensureInitialized();

    let result: unknown;
    try {
      result = await runStatement(
        this.db,
        `UPDATE ${this.tableName}
        SET ${ENDPOINT_COLUMNS.map((column) => `${column} = ?`).join(", ")}
        WHERE id = ?`,
        [...toColumnValues(endpoint), endpointId],
      );
    } catch (error) {
      const conflict = await this.findUrlConflict(
        endpoint.url,
        endpointId,
      ).catch(() => undefined);
      throw conflict ?? error;
    }

    // D1 counts the rows the UPDATE changed, so an endpoint removed after the
    // caller read it is caught by the same statement. A client that does not
    // report changes gets a read-back instead.
    const changes = changedRows(result);
    const missing =
      changes === undefined
        ? (await this.get(endpointId)) === null
        : changes === 0;
    if (missing) {
      throw new Error(`Webhook endpoint ${endpointId} not found`);
    }
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

  private async findConflict(
    endpoint: WebhookEndpoint,
  ): Promise<WebhookEndpointConflictError | undefined> {
    const row = await queryFirst<EndpointRow>(
      this.db,
      `SELECT id, url, created_at FROM ${this.tableName} WHERE id = ? OR url = ? LIMIT 1`,
      [endpoint.id, endpoint.url],
    );
    if (!row) return undefined;

    const storedId = toStringValue(row.id);
    // D1 can report a failure after the INSERT committed. The row found is
    // then this endpoint, and the original error is the one to report.
    if (
      storedId === endpoint.id &&
      toStringValue(row.url) === endpoint.url &&
      toNumber(row.created_at, Number.NaN) === endpoint.createdAt.getTime()
    ) {
      return undefined;
    }
    return storedId === endpoint.id
      ? new WebhookEndpointConflictError("id", endpoint.id, storedId)
      : new WebhookEndpointConflictError("url", endpoint.url, storedId);
  }

  private async findUrlConflict(
    url: string,
    endpointId: string,
  ): Promise<WebhookEndpointConflictError | undefined> {
    const row = await queryFirst<EndpointRow>(
      this.db,
      `SELECT id FROM ${this.tableName} WHERE url = ? AND id <> ? LIMIT 1`,
      [url, endpointId],
    );
    return row
      ? new WebhookEndpointConflictError("url", url, toStringValue(row.id))
      : undefined;
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
