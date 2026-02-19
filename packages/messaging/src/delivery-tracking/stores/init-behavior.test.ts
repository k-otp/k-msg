import { describe, expect, test } from "bun:test";
import { BunSqlDeliveryTrackingStore } from "./bun-sql.store";
import { SqliteDeliveryTrackingStore } from "./sqlite.store";

describe("Delivery tracking store init behavior", () => {
  test("SqliteDeliveryTrackingStore retries init after failure and self-inits", async () => {
    const store = new SqliteDeliveryTrackingStore({ dbPath: ":memory:" });
    const sqlite = (store as { db: { exec: (sql: string) => unknown } }).db;
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
});
