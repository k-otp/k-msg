import { describe, expect, test } from "bun:test";
import * as mysqlCore from "drizzle-orm/mysql-core";
import * as pgCore from "drizzle-orm/pg-core";
import * as sqliteCore from "drizzle-orm/sqlite-core";
import type {
  DeliveryTrackingFieldCryptoSchemaOptions,
  DeliveryTrackingTypeStrategy,
} from "./delivery-tracking-schema";
import { renderDrizzleSchemaSource } from "./drizzle-schema";
import type { SqlDialect } from "./sql-client";
import {
  buildCloudflareSqlSchemaSql,
  buildJobQueueSchemaSql,
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

const queueIndexNames = { dequeue: "otp_jobs_dequeue", id: "otp_jobs_id" };

// Every value of every type strategy field.
const TYPE_STRATEGIES: Partial<DeliveryTrackingTypeStrategy>[] = [
  {},
  { messageId: "varchar", id: "varchar" },
  { messageId: "uuid" },
  { shortText: "text" },
  { json: "text" },
  { timestamp: "integer" },
  { timestamp: "date" },
];
// Plain columns, encrypted columns, and both.
const FIELD_CRYPTO_SCHEMAS: (
  | DeliveryTrackingFieldCryptoSchemaOptions
  | undefined
)[] = [
  undefined,
  { enabled: true, mode: "secure" },
  { enabled: true, mode: "secure", compatPlainColumns: true },
];

// A table as "type [not null] [primary key] [default n]" per column, and the
// columns of each index, in a form both schema outputs can be read into.
interface TableShape {
  columns: Record<string, string>;
  indexes: Record<string, string>;
}

function describeColumn(column: {
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  defaultValue?: unknown;
}): string {
  return [
    column.type.toLowerCase(),
    column.notNull || column.primaryKey ? " not null" : "",
    column.primaryKey ? " primary key" : "",
    column.defaultValue === undefined ? "" : ` default ${column.defaultValue}`,
  ].join("");
}

// The names Drizzle's getSQLType() uses for the SQL schema's types.
function drizzleTypeName(dialect: SqlDialect, sqlType: string): string {
  if (dialect === "mysql" && sqlType === "INTEGER") return "int";
  if (dialect === "postgres" && sqlType === "TIMESTAMPTZ") {
    return "timestamp with time zone";
  }
  return sqlType.toLowerCase();
}

function unquote(identifier: string): string {
  return identifier.slice(1, -1);
}

// Reads the table this package's SQL builders write: one column per line.
function readSqlTable(dialect: SqlDialect, sql: string): TableShape {
  const shape: TableShape = { columns: {}, indexes: {} };
  for (const line of sql.split("\n")) {
    const index = line.match(
      /^CREATE INDEX (?:IF NOT EXISTS )?(\S+) ON \S+ \((.+)\);$/,
    );
    if (index) {
      shape.indexes[unquote(index[1])] = index[2]
        .split(", ")
        .map(unquote)
        .join(", ");
      continue;
    }
    const column = line.match(/^ {2}(\S+) (\w+(?:\(\d+\))?)(.*?),?$/);
    if (!column) continue;
    shape.columns[unquote(column[1])] = describeColumn({
      type: drizzleTypeName(dialect, column[2]),
      notNull: column[3].includes("NOT NULL"),
      primaryKey: column[3].includes("PRIMARY KEY"),
      defaultValue: column[3].match(/DEFAULT (\S+)/)?.[1],
    });
  }
  return shape;
}

interface DrizzleColumnLike {
  name: string;
  notNull: boolean;
  primary: boolean;
  hasDefault: boolean;
  default: unknown;
  getSQLType(): string;
}

interface DrizzleTableConfigLike {
  columns: readonly DrizzleColumnLike[];
  indexes: readonly {
    config: { name?: string; columns: readonly unknown[] };
  }[];
}

// Evaluates generated Drizzle source with only the builders it imports, so a
// builder it forgets to import fails here as it would in the user's build.
function readDrizzleTable(dialect: SqlDialect, source: string): TableShape {
  const importLine = source.match(
    /^import \{ (.+) \} from "drizzle-orm\/[a-z-]+";$/m,
  );
  if (!importLine) throw new Error("no drizzle-orm import in the source");
  const names = importLine[1].split(", ");
  const core: Record<string, unknown> =
    dialect === "mysql"
      ? mysqlCore
      : dialect === "postgres"
        ? pgCore
        : sqliteCore;
  const body = source
    .replace(importLine[0], "")
    .replaceAll(/^export const (\w+) =/gm, "exports.$1 =");
  const exports: Record<string, unknown> = {};
  new Function(...names, "exports", body)(
    ...names.map((name) => core[name]),
    exports,
  );

  const table = exports.deliveryTrackingTable;
  const config = (
    dialect === "mysql"
      ? mysqlCore.getTableConfig(table as mysqlCore.MySqlTable)
      : dialect === "postgres"
        ? pgCore.getTableConfig(table as pgCore.PgTable)
        : sqliteCore.getTableConfig(table as sqliteCore.SQLiteTable)
  ) as DrizzleTableConfigLike;

  const shape: TableShape = { columns: {}, indexes: {} };
  for (const column of config.columns) {
    shape.columns[column.name] = describeColumn({
      type: column.getSQLType(),
      notNull: column.notNull,
      primaryKey: column.primary,
      defaultValue: column.hasDefault ? column.default : undefined,
    });
  }
  for (const index of config.indexes) {
    shape.indexes[index.config.name ?? ""] = index.config.columns
      .map((column) => (column as { name: string }).name)
      .join(", ");
  }
  return shape;
}

function mySqlTrackingColumns(
  options: {
    typeStrategy?: Partial<DeliveryTrackingTypeStrategy>;
    fieldCryptoSchema?: DeliveryTrackingFieldCryptoSchemaOptions;
  } = {},
): Record<string, string> {
  return readSqlTable(
    "mysql",
    buildCloudflareSqlSchemaSql({
      dialect: "mysql",
      target: "tracking",
      ...options,
    }),
  ).columns;
}

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

  test("queue schema creates its indexes under the configured names", async () => {
    const indexNamesIn = (sql: string) =>
      Array.from(
        sql.matchAll(/CREATE INDEX (?:IF NOT EXISTS )?["`]([^"`]+)["`]/g),
        (match) => match[1],
      );

    for (const dialect of ["sqlite", "postgres", "mysql"] as const) {
      expect(
        indexNamesIn(
          buildJobQueueSchemaSql({
            dialect,
            tableName: "otp_jobs",
            indexNames: queueIndexNames,
          }),
        ),
      ).toEqual(["otp_jobs_dequeue", "otp_jobs_id"]);
    }
    expect(
      indexNamesIn(
        buildCloudflareSqlSchemaSql({
          dialect: "postgres",
          target: "queue",
          queueTableName: "otp_jobs",
          queueIndexNames,
        }),
      ),
    ).toEqual(["otp_jobs_dequeue", "otp_jobs_id"]);

    const statements: string[] = [];
    await initializeCloudflareSqlSchema(
      {
        dialect: "postgres",
        async query(sql: string) {
          statements.push(sql);
          return { rows: [] };
        },
      },
      { target: "queue", queueTableName: "otp_jobs", queueIndexNames },
    );
    expect(indexNamesIn(statements.join("\n"))).toEqual([
      "otp_jobs_dequeue",
      "otp_jobs_id",
    ]);

    // A name that is left out or empty keeps its default.
    expect(
      indexNamesIn(
        buildJobQueueSchemaSql({
          dialect: "sqlite",
          indexNames: { dequeue: "otp_jobs_dequeue", id: " " },
        }),
      ),
    ).toEqual(["otp_jobs_dequeue", "idx_kmsg_jobs_id"]);
  });

  test("job queue delay column holds 64-bit milliseconds", () => {
    const delayType = (dialect: SqlDialect) =>
      /[`"]delay[`"] (\w+)/.exec(
        buildCloudflareSqlSchemaSql({ dialect, target: "queue" }),
      )?.[1];

    // A delay of 2^31 ms (about 24.9 days) overflows the 32-bit INTEGER of
    // Postgres and MySQL.
    expect(delayType("postgres")).toBe("BIGINT");
    expect(delayType("mysql")).toBe("BIGINT");
    // SQLite's INTEGER is 64-bit.
    expect(delayType("sqlite")).toBe("INTEGER");
  });

  // MySQL cannot use a TEXT or JSON column in a key without a prefix length
  // (error 1170), so the table or its index would not be created.
  test("MySQL keys and indexes use no TEXT or JSON column, whatever the type strategy", () => {
    for (const typeStrategy of TYPE_STRATEGIES) {
      for (const fieldCryptoSchema of FIELD_CRYPTO_SCHEMAS) {
        const table = readSqlTable(
          "mysql",
          buildCloudflareSqlSchemaSql({
            dialect: "mysql",
            target: "tracking",
            typeStrategy,
            fieldCryptoSchema,
          }),
        );
        const keyColumns = new Set(
          Object.values(table.indexes).flatMap((columns) =>
            columns.split(", "),
          ),
        );
        for (const [name, column] of Object.entries(table.columns)) {
          if (column.includes("primary key")) keyColumns.add(name);
        }

        for (const name of keyColumns) {
          expect({
            typeStrategy,
            fieldCryptoSchema,
            column: `${name} ${table.columns[name]}`,
          }).toEqual({
            typeStrategy,
            fieldCryptoSchema,
            column: expect.stringMatching(
              /^\S+ (varchar\(\d+\)|int|bigint)( |$)/,
            ),
          });
        }
      }
    }
  });

  test("MySQL makes keys VARCHAR and leaves other columns to the type strategy", () => {
    expect(mySqlTrackingColumns()).toMatchObject({
      message_id: "varchar(255) not null primary key",
      provider_id: "varchar(255) not null",
      provider_message_id: "varchar(255) not null",
      type: "varchar(64) not null",
      status: "varchar(64) not null",
      last_error: "json",
      metadata: "json",
    });
    expect(
      mySqlTrackingColumns({ typeStrategy: { messageId: "uuid" } }),
    ).toMatchObject({ message_id: "varchar(36) not null primary key" });
    expect(
      mySqlTrackingColumns({ typeStrategy: { shortText: "text" } }),
    ).toMatchObject({
      type: "text not null",
      status: "varchar(64) not null",
    });

    // The hashes are looked up through indexes. The encrypted values are not,
    // and encrypted metadata passes 255 characters once its JSON passes
    // about 110, so they keep the id strategy's TEXT.
    const secure = { enabled: true, mode: "secure" } as const;
    expect(mySqlTrackingColumns({ fieldCryptoSchema: secure })).toMatchObject({
      to_hash: "varchar(255) not null",
      from_hash: "varchar(255)",
      to_enc: "text not null",
      metadata_enc: "text",
      metadata_hashes: "json",
      retention_class: "varchar(64)",
    });
    expect(
      mySqlTrackingColumns({
        typeStrategy: { id: "varchar", shortText: "text" },
        fieldCryptoSchema: secure,
      }),
    ).toMatchObject({
      to_hash: "varchar(255) not null",
      to_enc: "varchar(255) not null",
      metadata_enc: "varchar(255)",
      retention_class: "varchar(64)",
      crypto_state: "text",
    });
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

  test("declares the column types, keys and indexes of the SQL schema", () => {
    for (const dialect of ["postgres", "mysql", "sqlite"] as const) {
      for (const typeStrategy of TYPE_STRATEGIES) {
        for (const fieldCryptoSchema of FIELD_CRYPTO_SCHEMAS) {
          const options = {
            dialect,
            target: "tracking",
            typeStrategy,
            fieldCryptoSchema,
            trackingStoreRaw: true,
          } as const;
          const drizzle = readDrizzleTable(
            dialect,
            renderDrizzleSchemaSource(options),
          );
          const sql = readSqlTable(
            dialect,
            buildCloudflareSqlSchemaSql(options),
          );

          expect({
            dialect,
            typeStrategy,
            fieldCryptoSchema,
            ...drizzle,
          }).toEqual({ dialect, typeStrategy, fieldCryptoSchema, ...sql });
        }
      }
    }
  });

  test("renders MySQL JSON columns with json() unless the strategy says text", () => {
    const auto = renderDrizzleSchemaSource({
      dialect: "mysql",
      target: "tracking",
    });
    const text = renderDrizzleSchemaSource({
      dialect: "mysql",
      target: "tracking",
      typeStrategy: { json: "text" },
    });

    expect(auto).toContain('lastError: json("last_error"),');
    expect(auto).toContain('metadata: json("metadata"),');
    expect(text).toContain('lastError: text("last_error"),');
    expect(text).toContain('metadata: text("metadata"),');
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

  test("renders the configured queue index names", () => {
    for (const dialect of ["sqlite", "postgres", "mysql"] as const) {
      const source = renderDrizzleSchemaSource({
        dialect,
        target: "queue",
        queueTableName: "otp_jobs",
        queueIndexNames,
      });

      expect(source).toContain('index("otp_jobs_dequeue")');
      expect(source).toContain('index("otp_jobs_id")');
      expect(source).not.toContain("idx_kmsg_jobs");
    }
  });

  test("renders a bigint job queue delay column", () => {
    for (const dialect of ["postgres", "mysql"] as const) {
      const source = renderDrizzleSchemaSource({ dialect, target: "queue" });

      expect(source).toContain(
        'delay: bigint("delay", { mode: "number" }).notNull().default(0),',
      );
    }
    // SQLite's integer() is 64-bit.
    expect(
      renderDrizzleSchemaSource({ dialect: "sqlite", target: "queue" }),
    ).toContain('delay: integer("delay").notNull().default(0),');
  });
});
