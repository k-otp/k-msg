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
