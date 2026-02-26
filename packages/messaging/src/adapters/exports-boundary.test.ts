import { describe, expect, test } from "bun:test";

describe("messaging export boundaries", () => {
  test("root export is runtime-neutral", async () => {
    const root = await import("../index");

    expect("BunSqlDeliveryTrackingStore" in root).toBe(false);
    expect("SqliteDeliveryTrackingStore" in root).toBe(false);
    expect("SQLiteJobQueue" in root).toBe(false);
    expect("JobProcessor" in root).toBe(false);
    expect("MessageRetryHandler" in root).toBe(false);
    expect("createDeliveryTrackingHooks" in root).toBe(false);
    expect("DeliveryTrackingService" in root).toBe(false);
    expect("InMemoryDeliveryTrackingStore" in root).toBe(false);
    expect("BulkMessageSender" in root).toBe(false);
    expect("JobStatus" in root).toBe(false);

    expect(typeof root.KMsg).toBe("function");
  });

  test("tracking subpath exports tracking symbols", async () => {
    const tracking = await import("../tracking/index");

    expect(typeof tracking.createDeliveryTrackingHooks).toBe("function");
    expect(typeof tracking.DeliveryTrackingService).toBe("function");
    expect(typeof tracking.InMemoryDeliveryTrackingStore).toBe("function");
    expect(typeof tracking.isTerminalDeliveryStatus).toBe("function");
    expect(typeof tracking.DEFAULT_POLLING_CONFIG).toBe("object");
  });

  test("sender subpath exports sender symbols", async () => {
    const sender = await import("../sender/index");

    expect(typeof sender.BulkMessageSender).toBe("function");
  });

  test("queue subpath exports queue symbols", async () => {
    const queue = await import("../queue/index");

    expect(typeof queue.JobStatus).toBe("object");
    expect(queue.JobStatus.PENDING).toBe("pending");
    expect(typeof queue.buildSendInputFromJob).toBe("function");
    expect(typeof queue.buildSendInputFromJobDetailed).toBe("function");
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
    expect(typeof cloudflareAdapter.createDrizzleSqlClient).toBe("function");
    expect(typeof cloudflareAdapter.createDrizzleDeliveryTrackingStore).toBe(
      "function",
    );
    expect(typeof cloudflareAdapter.createDrizzleJobQueue).toBe("function");
    expect(typeof cloudflareAdapter.buildCloudflareSqlSchemaSql).toBe(
      "function",
    );
    expect(typeof cloudflareAdapter.renderDrizzleSchemaSource).toBe("function");
  }, 15_000);
});
