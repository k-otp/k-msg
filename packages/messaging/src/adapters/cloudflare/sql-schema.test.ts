import { describe, expect, test } from "bun:test";
import { renderDrizzleSchemaSource } from "./drizzle-schema";
import {
  buildCloudflareSqlSchemaSql,
  initializeCloudflareSqlSchema,
} from "./sql-schema";

describe("Cloudflare SQL schema builders", () => {
  test("buildCloudflareSqlSchemaSql renders both tracking and queue tables", () => {
    const sql = buildCloudflareSqlSchemaSql({
      dialect: "postgres",
      target: "both",
    });

    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "kmsg_delivery_tracking"',
    );
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "kmsg_jobs"');
    expect(sql).toContain("idx_kmsg_delivery_due");
    expect(sql).toContain("idx_kmsg_jobs_dequeue");
  });

  test("initializeCloudflareSqlSchema ignores duplicate/exists index errors", async () => {
    let indexFailures = 0;
    const client = {
      dialect: "mysql" as const,
      async query(sql: string) {
        if (sql.includes("CREATE INDEX")) {
          indexFailures += 1;
          const duplicate = new Error("Duplicate key name");
          (duplicate as { code: string }).code = "ER_DUP_KEYNAME";
          throw duplicate;
        }
        return { rows: [] };
      },
    };

    await expect(
      initializeCloudflareSqlSchema(client, {
        target: "tracking",
      }),
    ).resolves.toBeUndefined();
    expect(indexFailures).toBeGreaterThan(0);
  });

  test("initializeCloudflareSqlSchema throws non-duplicate errors", async () => {
    const client = {
      dialect: "postgres" as const,
      async query(sql: string) {
        if (sql.includes("CREATE TABLE")) {
          throw new Error("permission denied");
        }
        return { rows: [] };
      },
    };

    await expect(
      initializeCloudflareSqlSchema(client, {
        target: "tracking",
      }),
    ).rejects.toThrow("permission denied");
  });
});

describe("Drizzle schema renderer", () => {
  test("renders target-specific schema source", () => {
    const source = renderDrizzleSchemaSource({
      dialect: "postgres",
      target: "tracking",
      trackingTableName: "otp_tracking",
    });

    expect(source).toContain('from "drizzle-orm/pg-core"');
    expect(source).toContain('"otp_tracking"');
    expect(source).toContain("deliveryTrackingTable");
    expect(source).not.toContain("jobQueueTable");
  });
});
