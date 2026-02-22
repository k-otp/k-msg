import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { defineCommand, option } from "@bunli/core";
import {
  applyFieldCryptoMigration,
  type CloudflareSqlClient,
  getFieldCryptoMigrationStatus,
  getLatestFieldCryptoMigrationRun,
  planFieldCryptoMigration,
  retryFieldCryptoMigration,
} from "@k-msg/messaging/adapters/cloudflare";
import { z } from "zod";
import { strictBooleanFlagSchema } from "../cli/options";

const chunkSizeSchema = z.coerce.number().int().positive().max(100_000);
const maxChunksSchema = z.coerce.number().int().positive().max(100_000);

type SqliteBinding = string | number | bigint | boolean | Uint8Array | null;

function toSqliteBinding(value: unknown): SqliteBinding {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return value;
  if (typeof value === "boolean") return value;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function toSqliteBindings(values: readonly unknown[]): SqliteBinding[] {
  return values.map((value) => toSqliteBinding(value));
}

function toSqliteClient(filePath: string): {
  client: CloudflareSqlClient;
  close: () => void;
} {
  const database = new Database(filePath, { create: true });
  const client: CloudflareSqlClient = {
    dialect: "sqlite",
    async query<T = Record<string, unknown>>(
      sql: string,
      params: readonly unknown[] = [],
    ) {
      const trimmed = sql.trim().toUpperCase();
      const statement = database.query(sql);
      const bindings = toSqliteBindings(params);
      if (trimmed.startsWith("SELECT")) {
        const rows = statement.all(...bindings) as T[];
        return {
          rows,
          rowCount: rows.length,
        };
      }

      const result = statement.run(...bindings) as { changes?: number };
      return {
        rows: [],
        rowCount:
          typeof result.changes === "number" ? Math.trunc(result.changes) : 0,
      };
    },
  };

  return {
    client,
    close: () => database.close(),
  };
}

function toSnapshotPath(snapshotDir: string, planId: string): string {
  return path.join(snapshotDir, `${planId}.json`);
}

async function writeSnapshot(
  snapshotDir: string,
  planId: string,
  payload: unknown,
): Promise<void> {
  await mkdir(snapshotDir, { recursive: true });
  const filePath = toSnapshotPath(snapshotDir, planId);
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  await Bun.write(filePath, content);
}

async function resolvePlanId(
  client: CloudflareSqlClient,
  flags: {
    "plan-id"?: string;
    table?: string;
    "runs-table"?: string;
    "chunks-table"?: string;
  },
): Promise<string> {
  const direct = flags["plan-id"]?.trim();
  if (direct) return direct;

  const latest = await getLatestFieldCryptoMigrationRun(
    client,
    flags.table ?? "kmsg_delivery_tracking",
    {
      runsTableName: flags["runs-table"],
      chunksTableName: flags["chunks-table"],
    },
  );
  if (!latest) {
    throw new Error(
      "No migration plan found. Run `db tracking migrate plan` first.",
    );
  }
  return latest.planId;
}

const planCmd = defineCommand({
  name: "plan",
  description: "Create/refresh a field-crypto migration plan for tracking SQL",
  options: {
    "sqlite-file": option(z.string().min(1), {
      description: "SQLite database file path",
    }),
    table: option(z.string().min(1).optional(), {
      description: "Tracking table name (default: kmsg_delivery_tracking)",
    }),
    "chunk-size": option(chunkSizeSchema.optional(), {
      description: "Chunk size for keyset backfill (default: 1000)",
    }),
    "snapshot-dir": option(z.string().min(1).optional(), {
      description: "Snapshot directory (default: .kmsg/migrations)",
    }),
    "runs-table": option(z.string().min(1).optional(), {
      description:
        "Migration run state table (default: kmsg_crypto_migration_runs)",
    }),
    "chunks-table": option(z.string().min(1).optional(), {
      description:
        "Migration chunk state table (default: kmsg_crypto_migration_chunks)",
    }),
  },
  handler: async ({ flags }) => {
    const snapshotDir = flags["snapshot-dir"] ?? ".kmsg/migrations";
    const sqliteFile = path.resolve(process.cwd(), flags["sqlite-file"]);
    const { client, close } = toSqliteClient(sqliteFile);

    try {
      const plan = await planFieldCryptoMigration({
        client,
        trackingTableName: flags.table,
        chunkSize: flags["chunk-size"],
        runsTableName: flags["runs-table"],
        chunksTableName: flags["chunks-table"],
      });

      await writeSnapshot(snapshotDir, plan.planId, {
        type: "plan",
        generatedAt: new Date().toISOString(),
        sqliteFile,
        ...plan,
      });

      console.log(
        `Planned migration ${plan.planId} (rows=${plan.totalRows}, chunks=${plan.estimatedChunks}, chunkSize=${plan.chunkSize})`,
      );
    } finally {
      close();
    }
  },
});

const applyCmd = defineCommand({
  name: "apply",
  description: "Apply field-crypto migration chunks",
  options: {
    "sqlite-file": option(z.string().min(1), {
      description: "SQLite database file path",
    }),
    "plan-id": option(z.string().min(1).optional(), {
      description: "Plan id (default: latest for table)",
    }),
    table: option(z.string().min(1).optional(), {
      description: "Tracking table name (default: kmsg_delivery_tracking)",
    }),
    "max-chunks": option(maxChunksSchema.optional(), {
      description: "Max chunks to process for this run",
    }),
    "snapshot-dir": option(z.string().min(1).optional(), {
      description: "Snapshot directory (default: .kmsg/migrations)",
    }),
    "runs-table": option(z.string().min(1).optional(), {
      description:
        "Migration run state table (default: kmsg_crypto_migration_runs)",
    }),
    "chunks-table": option(z.string().min(1).optional(), {
      description:
        "Migration chunk state table (default: kmsg_crypto_migration_chunks)",
    }),
    json: option(strictBooleanFlagSchema, {
      description: "Print machine-readable JSON output",
    }),
  },
  handler: async ({ flags }) => {
    const snapshotDir = flags["snapshot-dir"] ?? ".kmsg/migrations";
    const sqliteFile = path.resolve(process.cwd(), flags["sqlite-file"]);
    const { client, close } = toSqliteClient(sqliteFile);

    try {
      const planId = await resolvePlanId(client, flags);
      const result = await applyFieldCryptoMigration(client, {
        planId,
        trackingTableName: flags.table,
        maxChunks: flags["max-chunks"],
        runsTableName: flags["runs-table"],
        chunksTableName: flags["chunks-table"],
      });

      const status = await getFieldCryptoMigrationStatus(client, planId, {
        runsTableName: flags["runs-table"],
        chunksTableName: flags["chunks-table"],
      });

      await writeSnapshot(snapshotDir, planId, {
        type: "apply",
        generatedAt: new Date().toISOString(),
        sqliteFile,
        result,
        status,
      });

      if (flags.json) {
        console.log(JSON.stringify({ planId, result, status }, null, 2));
      } else {
        console.log(
          `Applied migration ${planId}: chunks=${result.processedChunks}, rows=${result.processedRows}, failed=${result.failedChunks}, status=${result.status}`,
        );
      }
    } finally {
      close();
    }
  },
});

const statusCmd = defineCommand({
  name: "status",
  description: "Show migration status",
  options: {
    "sqlite-file": option(z.string().min(1), {
      description: "SQLite database file path",
    }),
    "plan-id": option(z.string().min(1).optional(), {
      description: "Plan id (default: latest for table)",
    }),
    table: option(z.string().min(1).optional(), {
      description: "Tracking table name (default: kmsg_delivery_tracking)",
    }),
    "runs-table": option(z.string().min(1).optional(), {
      description:
        "Migration run state table (default: kmsg_crypto_migration_runs)",
    }),
    "chunks-table": option(z.string().min(1).optional(), {
      description:
        "Migration chunk state table (default: kmsg_crypto_migration_chunks)",
    }),
  },
  handler: async ({ flags }) => {
    const sqliteFile = path.resolve(process.cwd(), flags["sqlite-file"]);
    const { client, close } = toSqliteClient(sqliteFile);

    try {
      const planId = await resolvePlanId(client, flags);
      const status = await getFieldCryptoMigrationStatus(client, planId, {
        runsTableName: flags["runs-table"],
        chunksTableName: flags["chunks-table"],
      });
      console.log(JSON.stringify({ planId, status }, null, 2));
    } finally {
      close();
    }
  },
});

const retryCmd = defineCommand({
  name: "retry",
  description: "Retry failed migration chunks only",
  options: {
    "sqlite-file": option(z.string().min(1), {
      description: "SQLite database file path",
    }),
    "plan-id": option(z.string().min(1).optional(), {
      description: "Plan id (default: latest for table)",
    }),
    table: option(z.string().min(1).optional(), {
      description: "Tracking table name (default: kmsg_delivery_tracking)",
    }),
    "max-chunks": option(maxChunksSchema.optional(), {
      description: "Max failed chunks to retry",
    }),
    "snapshot-dir": option(z.string().min(1).optional(), {
      description: "Snapshot directory (default: .kmsg/migrations)",
    }),
    "runs-table": option(z.string().min(1).optional(), {
      description:
        "Migration run state table (default: kmsg_crypto_migration_runs)",
    }),
    "chunks-table": option(z.string().min(1).optional(), {
      description:
        "Migration chunk state table (default: kmsg_crypto_migration_chunks)",
    }),
  },
  handler: async ({ flags }) => {
    const snapshotDir = flags["snapshot-dir"] ?? ".kmsg/migrations";
    const sqliteFile = path.resolve(process.cwd(), flags["sqlite-file"]);
    const { client, close } = toSqliteClient(sqliteFile);

    try {
      const planId = await resolvePlanId(client, flags);
      const result = await retryFieldCryptoMigration(client, {
        planId,
        trackingTableName: flags.table,
        maxChunks: flags["max-chunks"],
        runsTableName: flags["runs-table"],
        chunksTableName: flags["chunks-table"],
      });

      const status = await getFieldCryptoMigrationStatus(client, planId, {
        runsTableName: flags["runs-table"],
        chunksTableName: flags["chunks-table"],
      });

      await writeSnapshot(snapshotDir, planId, {
        type: "retry",
        generatedAt: new Date().toISOString(),
        sqliteFile,
        result,
        status,
      });

      console.log(
        `Retried migration ${planId}: chunks=${result.processedChunks}, rows=${result.processedRows}, failed=${result.failedChunks}, status=${result.status}`,
      );
    } finally {
      close();
    }
  },
});

export default defineCommand({
  name: "migrate",
  description: "Legacy -> secure field-crypto migration orchestrator",
  commands: [planCmd, applyCmd, statusCmd, retryCmd],
  handler: async () => {
    console.log("Use a subcommand: plan | apply | status | retry");
  },
});
