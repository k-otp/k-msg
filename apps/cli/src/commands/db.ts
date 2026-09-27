import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  buildCloudflareSqlSchemaSql,
  type CloudflareSqlSchemaTarget,
  type DeliveryTrackingTypeStrategy,
  renderDrizzleSchemaSource,
  type SqlDialect,
} from "@k-msg/messaging/adapters/cloudflare";
import { z } from "zod";
import { defineCommand, defineGroup, option } from "../cli/command-contract";
import { booleanFlagOption, strictBooleanFlagSchema } from "../cli/options";
import trackingMigrateCmd from "./db-tracking-migrate";

const dialectSchema = z.enum(["postgres", "mysql", "sqlite"]);
const targetSchema = z.enum(["tracking", "queue", "both"]);
const formatSchema = z.enum(["drizzle", "sql", "both"]);
const tableNameSchema = z.string().trim().min(1);

type SchemaFormat = z.infer<typeof formatSchema>;

// The schema options of the SQL stores and queues, so the printed schema is
// the one a store configured with them expects.
const schemaShapeOptions = {
  "message-id-type": option(z.enum(["text", "uuid", "varchar"]).optional(), {
    description:
      "Tracking message id column type: text | uuid | varchar (default: text)",
  }),
  "id-type": option(z.enum(["text", "varchar"]).optional(), {
    description:
      "Tracking provider and encrypted id column type: text | varchar (default: text)",
  }),
  "short-text-type": option(z.enum(["text", "varchar"]).optional(), {
    description:
      "Tracking short text column type (type, to, from, status, ...): text | varchar (default: varchar, VARCHAR(64))",
  }),
  "timestamp-type": option(z.enum(["bigint", "integer", "date"]).optional(), {
    description:
      "Tracking timestamp column type: bigint | integer | date (default: bigint epoch milliseconds; date is TIMESTAMPTZ on Postgres)",
  }),
  "json-type": option(z.enum(["auto", "text"]).optional(), {
    description:
      "Tracking JSON column type: auto (Postgres JSONB, MySQL JSON) | text (default: auto)",
  }),
  "tracking-table": option(tableNameSchema.optional(), {
    description: "Tracking table name (default: kmsg_delivery_tracking)",
  }),
  "queue-table": option(tableNameSchema.optional(), {
    description: "Job queue table name (default: kmsg_jobs)",
  }),
  "store-raw": booleanFlagOption(strictBooleanFlagSchema, {
    description:
      "Include the tracking raw column, as storeRaw: true does (boolean: --store-raw, --store-raw true|false, --no-store-raw; default: false)",
  }),
};

interface SchemaShapeFlags {
  "message-id-type"?: DeliveryTrackingTypeStrategy["messageId"];
  "id-type"?: DeliveryTrackingTypeStrategy["id"];
  "short-text-type"?: DeliveryTrackingTypeStrategy["shortText"];
  "timestamp-type"?: DeliveryTrackingTypeStrategy["timestamp"];
  "json-type"?: DeliveryTrackingTypeStrategy["json"];
  "tracking-table"?: string;
  "queue-table"?: string;
  "store-raw"?: boolean;
}

interface SchemaShape {
  typeStrategy: Partial<DeliveryTrackingTypeStrategy>;
  trackingTableName?: string;
  queueTableName?: string;
  trackingStoreRaw: boolean;
}

function resolveSchemaShape(flags: SchemaShapeFlags): SchemaShape {
  const typeStrategy: Partial<DeliveryTrackingTypeStrategy> = {};
  if (flags["message-id-type"]) {
    typeStrategy.messageId = flags["message-id-type"];
  }
  if (flags["id-type"]) typeStrategy.id = flags["id-type"];
  if (flags["short-text-type"]) {
    typeStrategy.shortText = flags["short-text-type"];
  }
  if (flags["timestamp-type"]) {
    typeStrategy.timestamp = flags["timestamp-type"];
  }
  if (flags["json-type"]) typeStrategy.json = flags["json-type"];
  return {
    typeStrategy,
    trackingTableName: flags["tracking-table"],
    queueTableName: flags["queue-table"],
    trackingStoreRaw: flags["store-raw"] === true,
  };
}

function resolveTarget(
  value: CloudflareSqlSchemaTarget | undefined,
): CloudflareSqlSchemaTarget {
  return value ?? "both";
}

function resolveFormat(value: SchemaFormat | undefined): SchemaFormat {
  return value ?? "both";
}

function renderOutputs(input: {
  dialect: SqlDialect;
  target?: CloudflareSqlSchemaTarget;
  format?: SchemaFormat;
  shape: SchemaShape;
}): {
  drizzle?: string;
  sql?: string;
} {
  const target = resolveTarget(input.target);
  const format = resolveFormat(input.format);
  const outputs: {
    drizzle?: string;
    sql?: string;
  } = {};

  if (format === "drizzle" || format === "both") {
    outputs.drizzle = renderDrizzleSchemaSource({
      dialect: input.dialect,
      target,
      ...input.shape,
    });
  }

  if (format === "sql" || format === "both") {
    outputs.sql = buildCloudflareSqlSchemaSql({
      dialect: input.dialect,
      target,
      ...input.shape,
    });
  }

  return outputs;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const schemaPrintCmd = defineCommand({
  name: "print",
  description: "Print SQL/Drizzle schema source to stdout",
  options: {
    dialect: option(dialectSchema, {
      description: "SQL dialect (required)",
    }),
    target: option(targetSchema.optional(), {
      description: "Schema target: tracking | queue | both (default: both)",
    }),
    format: option(formatSchema.optional(), {
      description: "Output format: drizzle | sql | both (default: both)",
    }),
    ...schemaShapeOptions,
  },
  handler: async ({ flags }) => {
    try {
      const outputs = renderOutputs({
        dialect: flags.dialect,
        target: flags.target,
        format: flags.format,
        shape: resolveSchemaShape(flags),
      });
      if (outputs.drizzle && outputs.sql) {
        console.log(
          `/* drizzle schema */\n${outputs.drizzle.trimEnd()}\n\n/* sql schema */\n${outputs.sql.trimEnd()}`,
        );
        return;
      }

      if (outputs.drizzle) {
        console.log(outputs.drizzle.trimEnd());
        return;
      }

      if (outputs.sql) {
        console.log(outputs.sql.trimEnd());
        return;
      }

      if (!outputs.drizzle && !outputs.sql) {
        throw new Error("No schema output generated");
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    }
  },
});

const schemaGenerateCmd = defineCommand({
  name: "generate",
  description: "Generate SQL/Drizzle schema files",
  options: {
    dialect: option(dialectSchema, {
      description: "SQL dialect (required)",
    }),
    target: option(targetSchema.optional(), {
      description: "Schema target: tracking | queue | both (default: both)",
    }),
    format: option(formatSchema.optional(), {
      description: "Output format: drizzle | sql | both (default: both)",
    }),
    "out-dir": option(z.string().min(1).optional(), {
      description: "Output directory (default: current directory)",
    }),
    "drizzle-file": option(z.string().min(1).optional(), {
      description: "Drizzle output file name (default: kmsg.schema.ts)",
    }),
    "sql-file": option(z.string().min(1).optional(), {
      description: "SQL output file name (default: kmsg.schema.sql)",
    }),
    force: booleanFlagOption(strictBooleanFlagSchema, {
      description:
        "Overwrite existing files (boolean: --force, --force true|false, --no-force; default: false)",
    }),
    ...schemaShapeOptions,
  },
  handler: async ({ flags }) => {
    try {
      const outputs = renderOutputs({
        dialect: flags.dialect,
        target: flags.target,
        format: flags.format,
        shape: resolveSchemaShape(flags),
      });

      const outDir = path.resolve(process.cwd(), flags["out-dir"] ?? ".");
      const drizzleFile = flags["drizzle-file"] ?? "kmsg.schema.ts";
      const sqlFile = flags["sql-file"] ?? "kmsg.schema.sql";

      const outputFiles: Array<{ path: string; content: string }> = [];
      if (outputs.drizzle) {
        outputFiles.push({
          path: path.join(outDir, drizzleFile),
          content: outputs.drizzle,
        });
      }
      if (outputs.sql) {
        outputFiles.push({
          path: path.join(outDir, sqlFile),
          content: outputs.sql,
        });
      }

      if (outputFiles.length === 0) {
        throw new Error("No schema output generated");
      }

      await mkdir(outDir, { recursive: true });

      if (!flags.force) {
        for (const output of outputFiles) {
          if (await fileExists(output.path)) {
            throw new Error(
              `Output file already exists: ${output.path} (use --force to overwrite)`,
            );
          }
        }
      }

      for (const output of outputFiles) {
        const normalized = output.content.endsWith("\n")
          ? output.content
          : `${output.content}\n`;
        await Bun.write(output.path, normalized);
      }

      for (const output of outputFiles) {
        console.log(`Wrote ${output.path}`);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    }
  },
});

const schemaCmd = defineGroup({
  name: "schema",
  description: "Schema generators for SQL and Drizzle",
  commands: [schemaPrintCmd, schemaGenerateCmd],
});

const trackingCmd = defineGroup({
  name: "tracking",
  description: "Tracking table migration utilities",
  commands: [trackingMigrateCmd],
});

export default defineGroup({
  name: "db",
  description: "Database schema utilities",
  commands: [schemaCmd, trackingCmd],
});
