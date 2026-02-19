export type SqlDialect = "postgres" | "mysql" | "sqlite";

export interface CloudflareSqlQueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount?: number;
}

export interface CloudflareSqlClient {
  dialect: SqlDialect;
  query<T = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<CloudflareSqlQueryResult<T>>;
  transaction?<T>(fn: (tx: CloudflareSqlClient) => Promise<T>): Promise<T>;
  close?(): Promise<void> | void;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  all<T = Record<string, unknown>>(): Promise<{
    results?: T[];
    success?: boolean;
    meta?: { changes?: number };
  }>;
  run?(): Promise<{ success?: boolean; meta?: { changes?: number } }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface DrizzleSqlDatabaseLike {
  execute(query: unknown): Promise<unknown> | unknown;
  transaction?<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}

export interface CreateDrizzleSqlClientOptions {
  dialect: SqlDialect;
  db: DrizzleSqlDatabaseLike;
  renderQuery?: (input: {
    dialect: SqlDialect;
    sql: string;
    params: readonly unknown[];
  }) => unknown;
  normalizeResult?: <T = Record<string, unknown>>(input: {
    result: unknown;
    sql: string;
    params: readonly unknown[];
  }) => CloudflareSqlQueryResult<T>;
  mapTransactionDb?: (value: unknown) => DrizzleSqlDatabaseLike;
  close?: CloudflareSqlClient["close"];
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function defaultDrizzleQueryRenderer(input: {
  sql: string;
  params: readonly unknown[];
}): unknown {
  if (input.params.length === 0) return input.sql;
  return {
    sql: input.sql,
    params: [...input.params],
  };
}

function defaultDrizzleResultNormalizer<T = Record<string, unknown>>(input: {
  result: unknown;
}): CloudflareSqlQueryResult<T> {
  if (Array.isArray(input.result)) {
    return {
      rows: input.result as T[],
      rowCount: input.result.length,
    };
  }

  if (isRecord(input.result)) {
    const rowsValue =
      Array.isArray(input.result.rows) && input.result.rows.length >= 0
        ? (input.result.rows as T[])
        : Array.isArray(input.result.results)
          ? (input.result.results as T[])
          : Array.isArray(input.result.data)
            ? (input.result.data as T[])
            : [];

    const rowCount =
      toNumber(input.result.rowCount) ??
      toNumber(input.result.rowsAffected) ??
      toNumber(input.result.changes) ??
      (isRecord(input.result.meta)
        ? toNumber(input.result.meta.changes)
        : undefined) ??
      (rowsValue.length > 0 ? rowsValue.length : undefined);

    return {
      rows: rowsValue,
      rowCount,
    };
  }

  return { rows: [] };
}

function hasExecuteFunction(value: unknown): value is DrizzleSqlDatabaseLike {
  return isRecord(value) && typeof value.execute === "function";
}

export function createCloudflareSqlClient(options: {
  dialect: SqlDialect;
  query: CloudflareSqlClient["query"];
  transaction?: CloudflareSqlClient["transaction"];
  close?: CloudflareSqlClient["close"];
}): CloudflareSqlClient {
  return {
    dialect: options.dialect,
    query: options.query,
    ...(options.transaction ? { transaction: options.transaction } : {}),
    ...(options.close ? { close: options.close } : {}),
  };
}

export async function runCloudflareSqlTransaction<T>(
  client: CloudflareSqlClient,
  fn: (tx: CloudflareSqlClient) => Promise<T>,
): Promise<T> {
  if (typeof client.transaction === "function") {
    return client.transaction(fn);
  }
  return fn(client);
}

export function createD1SqlClient(db: D1DatabaseLike): CloudflareSqlClient {
  return {
    dialect: "sqlite",
    async query<T = Record<string, unknown>>(
      sql: string,
      params: readonly unknown[] = [],
    ): Promise<CloudflareSqlQueryResult<T>> {
      const prepared = db.prepare(sql);
      const statement = params.length > 0 ? prepared.bind(...params) : prepared;

      try {
        const result = await statement.all<T>();
        return {
          rows: Array.isArray(result.results) ? result.results : [],
          rowCount:
            typeof result.meta?.changes === "number"
              ? result.meta.changes
              : undefined,
        };
      } catch {
        if (typeof statement.run === "function") {
          const result = await statement.run();
          return {
            rows: [],
            rowCount:
              typeof result.meta?.changes === "number"
                ? result.meta.changes
                : undefined,
          };
        }
        throw new Error("D1 statement execution failed");
      }
    },
  };
}

export function createDrizzleSqlClient(
  options: CreateDrizzleSqlClientOptions,
): CloudflareSqlClient {
  const renderQuery = options.renderQuery ?? defaultDrizzleQueryRenderer;
  const normalizeResult =
    options.normalizeResult ?? defaultDrizzleResultNormalizer;
  const mapTransactionDb =
    options.mapTransactionDb ??
    ((value: unknown): DrizzleSqlDatabaseLike => {
      if (hasExecuteFunction(value)) {
        return value;
      }
      throw new Error(
        "Drizzle transaction callback must return an object with execute(query)",
      );
    });

  const client: CloudflareSqlClient = {
    dialect: options.dialect,
    async query<T = Record<string, unknown>>(
      sql: string,
      params: readonly unknown[] = [],
    ): Promise<CloudflareSqlQueryResult<T>> {
      const query = renderQuery({
        dialect: options.dialect,
        sql,
        params,
      });
      const result = await options.db.execute(query);
      return normalizeResult<T>({ result, sql, params });
    },
    ...(options.close ? { close: options.close } : {}),
  };

  const transaction = options.db.transaction;
  if (typeof transaction === "function") {
    client.transaction = async <T>(
      fn: (tx: CloudflareSqlClient) => Promise<T>,
    ): Promise<T> => {
      return transaction(async (txDb: unknown) => {
        const mapped = mapTransactionDb(txDb);
        const txClient = createDrizzleSqlClient({
          ...options,
          db: mapped,
        });
        return fn(txClient);
      });
    };
  }

  return client;
}
