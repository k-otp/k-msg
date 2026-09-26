import { describe, expect, test } from "bun:test";
import { BunSqlDeliveryTrackingStore } from "./bun-sql.store";
import { SqliteDeliveryTrackingStore } from "./sqlite.store";

describe("Delivery tracking store init behavior", () => {
  test("SqliteDeliveryTrackingStore retries init after failure and self-inits", async () => {
    const store = new SqliteDeliveryTrackingStore({ dbPath: ":memory:" });
    const sqlite = (
      store as unknown as { db: { exec: (sql: string) => unknown } }
    ).db;
    const originalExec = sqlite.exec.bind(sqlite);

    let shouldFail = true;
    sqlite.exec = (sql: string) => {
      if (shouldFail && sql.includes("CREATE TABLE")) {
        shouldFail = false;
        throw new Error("schema init failed");
      }
      return originalExec(sql);
    };

    await expect(store.init()).rejects.toThrow("schema init failed");
    const found = await store.get("unknown-message-id");
    expect(found).toBeUndefined();

    store.close();
  });

  test("BunSqlDeliveryTrackingStore retries init after failure and self-inits", async () => {
    const sql = new Bun.SQL({
      adapter: "sqlite",
      filename: ":memory:",
    });
    const store = new BunSqlDeliveryTrackingStore({ sql });
    const originalUnsafe = sql.unsafe.bind(sql);

    let shouldFail = true;
    sql.unsafe = ((statement: string, ...args: unknown[]) => {
      if (shouldFail && statement.includes("CREATE TABLE")) {
        shouldFail = false;
        throw new Error("schema init failed");
      }
      return originalUnsafe(statement, ...(args as []));
    }) as typeof sql.unsafe;

    await expect(store.init()).rejects.toThrow("schema init failed");
    const found = await store.get("unknown-message-id");
    expect(found).toBeUndefined();

    await store.close();
  });

  test("Bun stores leave the schema to migrations with initializeSchema: false", async () => {
    const sqlite = new SqliteDeliveryTrackingStore({
      dbPath: ":memory:",
      initializeSchema: false,
    });
    await sqlite.init();
    // Nothing created the table.
    await expect(sqlite.get("m1")).rejects.toThrow(/no such table/);
    sqlite.close();

    const bunSql = new BunSqlDeliveryTrackingStore({ initializeSchema: false });
    await bunSql.init();
    await expect(bunSql.get("m1")).rejects.toThrow(/no such table/);
    await bunSql.close();
  });

  test("Bun stores create indexes under the configured names", async () => {
    const indexOptions = {
      indexNames: { due: "otp_due", providerMessage: "otp_provider_msg" },
      trackingIndexNames: { requestedAt: "otp_requested_at" },
    };
    // SQLite's own primary key index has no SQL.
    const listIndexes =
      "SELECT name FROM sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY name";
    const expected = ["otp_due", "otp_provider_msg", "otp_requested_at"];

    const sqlite = new SqliteDeliveryTrackingStore({
      dbPath: ":memory:",
      ...indexOptions,
    });
    await sqlite.init();
    const db = (
      sqlite as unknown as {
        db: { prepare: (sql: string) => { all: () => unknown[] } };
      }
    ).db;
    const sqliteIndexes = db.prepare(listIndexes).all() as { name: string }[];
    expect(sqliteIndexes.map((row) => row.name)).toEqual(expected);
    sqlite.close();

    const sql = new Bun.SQL({ adapter: "sqlite", filename: ":memory:" });
    await new BunSqlDeliveryTrackingStore({ sql, ...indexOptions }).init();
    const bunSqlIndexes: { name: string }[] = await sql.unsafe(listIndexes);
    expect(bunSqlIndexes.map((row) => row.name)).toEqual(expected);
    await sql.close();
  });
});
