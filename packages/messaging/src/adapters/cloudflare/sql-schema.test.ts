import { describe, expect, test } from "bun:test";
import { renderDrizzleSchemaSource } from "./drizzle-schema";
import type { SqlDialect } from "./sql-client";
import {
  buildCloudflareSqlSchemaSql,
  initializeCloudflareSqlSchema,
} from "./sql-schema";

const TIME_COLUMNS = [
  "requested_at",
  "status_updated_at",
  "next_check_at",
  "sent_at",
  "delivered_at",
  "failed_at",
  "last_checked_at",
  "scheduled_at",
];

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

  test("tracking schema defaults to kmsg_delivery_tracking without raw column", () => {
    const sql = buildCloudflareSqlSchemaSql({
      dialect: "sqlite",
      target: "tracking",
    });

    expect(sql).toContain(
      'CREATE TABLE IF NOT EXISTS "kmsg_delivery_tracking"',
    );
    expect(sql).not.toContain('"raw"');
  });

  test("tracking schema includes raw column when storeRaw=true", () => {
    const sql = buildCloudflareSqlSchemaSql({
      dialect: "sqlite",
      target: "tracking",
      trackingStoreRaw: true,
    });

    expect(sql).toContain('"raw" TEXT');
  });

  test("tracking schema respects tableName override", () => {
    const sql = buildCloudflareSqlSchemaSql({
      dialect: "postgres",
      target: "tracking",
      trackingTableName: "otp_tracking",
    });

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "otp_tracking"');
    expect(sql).not.toContain(
      'CREATE TABLE IF NOT EXISTS "kmsg_delivery_tracking"',
    );
  });

  test("tracking schema supports postgres date timestamp strategy", () => {
    const sql = buildCloudflareSqlSchemaSql({
      dialect: "postgres",
      target: "tracking",
      typeStrategy: {
        timestamp: "date",
      },
    });

    expect(sql).toContain('"requested_at" TIMESTAMPTZ NOT NULL');
    expect(sql).toContain('"next_check_at" TIMESTAMPTZ NOT NULL');
  });

  test("integer timestamp strategy creates 64-bit time columns", () => {
    const timeColumnTypes = (dialect: SqlDialect) => {
      const sql = buildCloudflareSqlSchemaSql({
        dialect,
        target: "tracking",
        typeStrategy: { timestamp: "integer" },
      });
      return new Set(
        TIME_COLUMNS.map(
          (column) => new RegExp(`[\`"]${column}[\`"] (\\w+)`).exec(sql)?.[1],
        ),
      );
    };

    // Epoch milliseconds overflow the 32-bit INTEGER of Postgres and MySQL.
    expect(timeColumnTypes("postgres")).toEqual(new Set(["BIGINT"]));
    expect(timeColumnTypes("mysql")).toEqual(new Set(["BIGINT"]));
    // SQLite's INTEGER is 64-bit.
    expect(timeColumnTypes("sqlite")).toEqual(new Set(["INTEGER"]));
  });

  test("provider_status_message is TEXT whatever the short text strategy", () => {
    for (const dialect of ["postgres", "mysql"] as const) {
      for (const shortText of ["varchar", "text"] as const) {
        const sql = buildCloudflareSqlSchemaSql({
          dialect,
          target: "tracking",
          typeStrategy: { shortText },
        });
        const quote = dialect === "mysql" ? "`" : '"';

        expect(sql).toContain(`${quote}provider_status_message${quote} TEXT,`);
      }
    }
  });

  test("initializeCloudflareSqlSchema ignores duplicate/exists index errors", async () => {
    let indexFailures = 0;
    const client = {
      dialect: "mysql" as const,
      async query(sql: string) {
        if (sql.includes("CREATE INDEX")) {
          indexFailures += 1;
          const duplicate = new Error("Duplicate key name");
          (duplicate as Error & { code?: string }).code = "ER_DUP_KEYNAME";
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

  test("respects trackingStoreRaw option in rendered source", () => {
    const withoutRaw = renderDrizzleSchemaSource({
      dialect: "postgres",
      target: "tracking",
    });
    const withRaw = renderDrizzleSchemaSource({
      dialect: "postgres",
      target: "tracking",
      trackingStoreRaw: true,
    });

    expect(withoutRaw).not.toContain("raw:");
    expect(withRaw).toContain("raw:");
  });

  test("renders providerStatusMessage as text", () => {
    for (const dialect of ["postgres", "mysql"] as const) {
      const source = renderDrizzleSchemaSource({
        dialect,
        target: "tracking",
      });

      expect(source).toContain(
        'providerStatusMessage: text("provider_status_message"),',
      );
    }
  });

  test("renders postgres timestamp(date) fields when date strategy is requested", () => {
    const source = renderDrizzleSchemaSource({
      dialect: "postgres",
      target: "tracking",
      typeStrategy: {
        timestamp: "date",
      },
    });

    expect(source).toContain(
      'timestamp("requested_at", { withTimezone: true, mode: "date" }).notNull()',
    );
    expect(source).toContain(
      "import { bigint, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar }",
    );
  });

  test("renders bigint time columns for the integer timestamp strategy", () => {
    for (const dialect of ["postgres", "mysql"] as const) {
      const source = renderDrizzleSchemaSource({
        dialect,
        target: "tracking",
        typeStrategy: { timestamp: "integer" },
      });

      for (const column of TIME_COLUMNS) {
        expect(source).toContain(`bigint("${column}", { mode: "number" })`);
      }
      expect(source).not.toMatch(/\bint(eger)?\("[a-z_]+_at"\)/);
    }
  });
});
