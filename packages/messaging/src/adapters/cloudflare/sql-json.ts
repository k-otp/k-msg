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

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// JSONB rejects NUL characters and unpaired surrogates; U+FFFD replaces them.
const UNPAIRED_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

function toJsonbString(value: string): string {
  return value.replaceAll("\u0000", "�").replace(UNPAIRED_SURROGATE, "�");
}

function jsonbReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "string") return toJsonbString(value);
  if (!isJsonObject(value)) return value;
  const keys = Object.keys(value);
  if (keys.every((key) => toJsonbString(key) === key)) return value;
  return Object.fromEntries(
    keys.map((key) => [toJsonbString(key), value[key]]),
  );
}

/**
 * The JSON text to bind for a JSON column. A JSONB column cannot hold NUL
 * characters or unpaired surrogates, so for one they become U+FFFD.
 */
export function toJsonText(value: unknown, jsonb: boolean): string {
  return jsonb ? JSON.stringify(value, jsonbReplacer) : JSON.stringify(value);
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
 * Reads a JSON column selected with `selectJsonAsTextSql`, exactly as it
 * was stored. Returns `undefined` for SQL NULL and for text that is not
 * JSON.
 */
export function readJsonColumn(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  // A client that decoded the value anyway.
  if (typeof value !== "string") return value;
  const parsed = parseJson(value);
  return parsed === NOT_JSON ? undefined : parsed;
}

/**
 * Reads a JSON column that always holds an object. Rows that postgres.js or
 * Bun.SQL wrote into JSONB columns before JSON parameters were cast hold the
 * object's JSON text as a JSON string; that string is read as its object.
 */
export function readJsonObjectColumn(
  value: unknown,
): Record<string, unknown> | undefined {
  let parsed = readJsonColumn(value);
  if (typeof parsed === "string") {
    const inner = parseJson(parsed);
    parsed = inner === NOT_JSON ? undefined : inner;
  }
  return isJsonObject(parsed) ? parsed : undefined;
}
