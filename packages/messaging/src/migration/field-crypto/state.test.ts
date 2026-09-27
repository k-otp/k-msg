import { describe, expect, test } from "bun:test";
import type {
  CloudflareSqlClient,
  SqlDialect,
} from "../../adapters/cloudflare/sql-client";
import { buildFieldCryptoMigrationMetaSchemaSql } from "../../adapters/cloudflare/sql-schema";
import { ensureFieldCryptoMigrationStateTables } from "./state";

function statementsOf(sql: string): string[] {
  return sql
    .split(";\n\n")
    .map((statement) => statement.trim().replace(/;$/, ""));
}

// Records each statement, and fails a CREATE INDEX for an index that exists,
// as MySQL does: it has no CREATE INDEX IF NOT EXISTS.
function recordingClient(dialect: SqlDialect): CloudflareSqlClient & {
  statements: string[];
} {
  const statements: string[] = [];
  const indexes = new Set<string>();
  const query = async (sql: string) => {
    statements.push(sql.trim());
    const index = sql.match(/^\s*CREATE INDEX (\S+)/)?.[1];
    if (index && dialect === "mysql") {
      if (indexes.has(index)) {
        throw Object.assign(
          new Error(`Duplicate key name '${index.slice(1, -1)}'`),
          { errno: 1061, code: "ER_DUP_KEYNAME" },
        );
      }
      indexes.add(index);
    }
    return { rows: [] };
  };
  return {
    dialect,
    statements,
    query: query as CloudflareSqlClient["query"],
  };
}

describe("field crypto migration state tables", () => {
  // MySQL cannot use a TEXT column in a key without a prefix length (error
  // 1170), so the tables could not be created there.
  test("key on VARCHAR columns on MySQL", () => {
    const mysql = buildFieldCryptoMigrationMetaSchemaSql({ dialect: "mysql" });

    expect(mysql).toContain("`plan_id` VARCHAR(255) PRIMARY KEY");
    expect(mysql).toContain("`plan_id` VARCHAR(255) NOT NULL");
    expect(mysql).toContain(
      "`status` VARCHAR(32) NOT NULL,\n  `start_requested_at`",
    );
    expect(mysql).toContain(
      "CREATE INDEX `kmsg_crypto_migration_chunks_status_idx` ON `kmsg_crypto_migration_chunks` (`plan_id`, `status`)",
    );
    expect(mysql).not.toMatch(/`(plan_id|chunk_no)` TEXT/);

    for (const dialect of ["postgres", "sqlite"] as const) {
      expect(buildFieldCryptoMigrationMetaSchemaSql({ dialect })).toContain(
        '"plan_id" TEXT PRIMARY KEY',
      );
    }
  });

  test("ensureFieldCryptoMigrationStateTables runs the statements of buildFieldCryptoMigrationMetaSchemaSql", async () => {
    for (const dialect of ["postgres", "mysql", "sqlite"] as const) {
      const client = recordingClient(dialect);
      const tables = {
        runsTableName: "otp_migration_runs",
        chunksTableName: "otp_migration_chunks",
      };
      await ensureFieldCryptoMigrationStateTables(client, tables);

      expect({ dialect, statements: client.statements }).toEqual({
        dialect,
        statements: statementsOf(
          buildFieldCryptoMigrationMetaSchemaSql({ dialect, ...tables }),
        ),
      });
    }
  });

  // plan, apply, retry and status each run it, so on MySQL every call after
  // the first found the chunk status index and failed with error 1061.
  test("ensureFieldCryptoMigrationStateTables runs again once the MySQL index exists", async () => {
    const client = recordingClient("mysql");

    await ensureFieldCryptoMigrationStateTables(client);
    await expect(
      ensureFieldCryptoMigrationStateTables(client),
    ).resolves.toBeUndefined();
  });

  test("ensureFieldCryptoMigrationStateTables still throws other errors", async () => {
    const client: CloudflareSqlClient = {
      dialect: "mysql",
      async query() {
        throw Object.assign(new Error("Access denied"), { errno: 1142 });
      },
    };

    await expect(ensureFieldCryptoMigrationStateTables(client)).rejects.toThrow(
      "Access denied",
    );
  });
});
