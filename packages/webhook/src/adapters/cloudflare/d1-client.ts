export type D1Row = Record<string, unknown>;

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T extends D1Row = D1Row>(): Promise<T | null>;
  all<T extends D1Row = D1Row>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  exec?(query: string): Promise<unknown>;
}

export function toDate(value: unknown): Date | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value);
  }

  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return new Date(asNumber);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return undefined;
}

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

export function safeJsonParse<T>(value: unknown): T | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export async function queryAll<T extends D1Row = D1Row>(
  db: D1DatabaseLike,
  sql: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const statement = db.prepare(sql).bind(...params);
  const result = await statement.all<T>();
  return result.results ?? [];
}

export async function queryFirst<T extends D1Row = D1Row>(
  db: D1DatabaseLike,
  sql: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const statement = db.prepare(sql).bind(...params);
  return statement.first<T>();
}

export async function runStatement(
  db: D1DatabaseLike,
  sql: string,
  params: readonly unknown[] = [],
): Promise<void> {
  const statement = db.prepare(sql).bind(...params);
  await statement.run();
}

export async function runStatements(
  db: D1DatabaseLike,
  sqlStatements: readonly string[],
): Promise<void> {
  const statements = sqlStatements
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  if (statements.length === 0) {
    return;
  }

  if (typeof db.exec === "function") {
    await db.exec(`${statements.join(";\n")};`);
    return;
  }

  for (const statement of statements) {
    await runStatement(db, statement);
  }
}
