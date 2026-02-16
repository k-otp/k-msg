import { describe, expect, test } from "bun:test";

describe("messaging export boundaries", () => {
  test("root export is runtime-neutral", async () => {
    const root = await import("../index");

    expect("BunSqlDeliveryTrackingStore" in root).toBe(false);
    expect("SqliteDeliveryTrackingStore" in root).toBe(false);
    expect("SQLiteJobQueue" in root).toBe(false);
    expect("JobProcessor" in root).toBe(false);
    expect("MessageRetryHandler" in root).toBe(false);

    expect(typeof root.KMsg).toBe("function");
    expect(typeof root.InMemoryDeliveryTrackingStore).toBe("function");
  });

  test("bun adapter exports runtime-specific bun symbols", async () => {
    const bunAdapter = await import("./bun/index");

    expect(typeof bunAdapter.BunSqlDeliveryTrackingStore).toBe("function");
    expect(typeof bunAdapter.SqliteDeliveryTrackingStore).toBe("function");
    expect(typeof bunAdapter.SQLiteJobQueue).toBe("function");
  });

  test("node adapter exports runtime-specific node symbols", async () => {
    const nodeAdapter = await import("./node/index");

    expect(typeof nodeAdapter.DeliveryTracker).toBe("function");
    expect(typeof nodeAdapter.JobProcessor).toBe("function");
    expect(typeof nodeAdapter.MessageRetryHandler).toBe("function");
  });

  test("cloudflare adapter exports cloudflare symbols", async () => {
    const cloudflareAdapter = await import("./cloudflare/index");

    expect(typeof cloudflareAdapter.HyperdriveDeliveryTrackingStore).toBe(
      "function",
    );
    expect(typeof cloudflareAdapter.HyperdriveJobQueue).toBe("function");
    expect(typeof cloudflareAdapter.createD1SqlClient).toBe("function");
    expect(typeof cloudflareAdapter.createKvDeliveryTrackingStore).toBe(
      "function",
    );
  });
});
