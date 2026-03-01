import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { defineCommand, defineGroup, option } from "@bunli/core";
import {
  buildCloudflareSqlSchemaSql,
  type CloudflareSqlSchemaTarget,
  renderDrizzleSchemaSource,
  type SqlDialect,
} from "@k-msg/messaging/adapters/cloudflare";
import { z } from "zod";
import { strictBooleanFlagSchema } from "../cli/options";
import trackingMigrateCmd from "./db-tracking-migrate";

const dialectSchema = z.enum(["postgres", "mysql", "sqlite"]);
const targetSchema = z.enum(["tracking", "queue", "both"]);
const formatSchema = z.enum(["drizzle", "sql", "both"]);

type SchemaFormat = z.infer<typeof formatSchema>;

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
    });
  }

  if (format === "sql" || format === "both") {
    outputs.sql = buildCloudflareSqlSchemaSql({
      dialect: input.dialect,
      target,
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
  },
  handler: async ({ flags }) => {
    try {
      const outputs = renderOutputs({
        dialect: flags.dialect,
        target: flags.target,
        format: flags.format,
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
    force: option(strictBooleanFlagSchema, {
      description:
        "Overwrite existing files (boolean: --force, --force true|false, --no-force; default: false)",
    }),
  },
  handler: async ({ flags }) => {
    try {
      const outputs = renderOutputs({
        dialect: flags.dialect,
        target: flags.target,
        format: flags.format,
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
