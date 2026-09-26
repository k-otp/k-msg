import type { SqlDialect } from "./sql-client";

// JSON columns hold JSON text on every write and are read as JSON text, so
// drivers cannot change the value on the way in or out:
// - postgres.js and Bun.SQL serialize a parameter that Postgres types as
//   JSON or JSONB with JSON.stringify. Bound directly, JSON text became a
//   JSON string, which `column->>'field'` cannot read. Typed as text and cast
//   in SQL, it is stored as the document it holds.
// - node-postgres, postgres.js and mysql2 return JSON columns decoded, each
//   in its own way. Cast to text, every driver returns the same JSON text.

const NOT_JSON = Symbol("not JSON");

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return NOT_JSON;
  }
}

/**
 * The value placeholder for a JSON parameter: on Postgres, JSON text typed
 * as text and cast to JSONB, so drivers bind it as is.
 */
export function jsonParameterSql(
  dialect: SqlDialect,
  placeholder: string,
  nativeJson: boolean,
): string {
  return dialect === "postgres" && nativeJson
    ? `${placeholder}::text::jsonb`
    : placeholder;
}

/** A select list entry that reads a JSON column as its JSON text. */
export function selectJsonAsTextSql(
  dialect: SqlDialect,
  quotedColumn: string,
): string {
  if (dialect === "postgres") {
    return `CAST(${quotedColumn} AS TEXT) AS ${quotedColumn}`;
  }
  if (dialect === "mysql") {
    return `CAST(${quotedColumn} AS CHAR) AS ${quotedColumn}`;
  }
  return quotedColumn;
}

/**
 * Reads a JSON column selected with `selectJsonAsTextSql`. Returns
 * `undefined` for SQL NULL and for text that is not JSON.
 *
 * With `nativeJson` (a JSON or JSONB column), a JSON string holding a JSON
 * object or array is read as that object or array: postgres.js and Bun.SQL
 * stored JSON that way before JSON parameters were cast.
 */
export function readJsonColumn(value: unknown, nativeJson: boolean): unknown {
  if (value === null || value === undefined) return undefined;
  // A client that decoded the value anyway.
  if (typeof value !== "string") return value;

  const parsed = parseJson(value);
  if (parsed === NOT_JSON) return undefined;
  if (nativeJson && typeof parsed === "string") {
    const inner = parseJson(parsed);
    if (typeof inner === "object" && inner !== null) return inner;
  }
  return parsed;
}
