import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  type CloudflareSqlClient,
  HyperdriveDeliveryTrackingStore,
} from "@k-msg/messaging/adapters/cloudflare";

const CLI_ENTRY = path.join(import.meta.dir, "..", "k-msg.ts");
const TABLE = "kmsg_delivery_tracking";
const KEY = Buffer.alloc(32, 7).toString("base64url");
const TEST_TIMEOUT = 30_000;

// Columns an operator adds to an existing plain table before migrating.
const SECURE_COLUMNS = [
  "to_enc TEXT",
  "to_hash TEXT",
  "to_masked TEXT",
  "from_enc TEXT",
  "from_hash TEXT",
  "from_masked TEXT",
  "metadata_enc TEXT",
  "metadata_hashes TEXT",
  "crypto_kid TEXT",
  "crypto_version INTEGER NOT NULL DEFAULT 1",
  "crypto_state TEXT",
  "retention_class TEXT",
  "retention_bucket_ym INTEGER",
];

function sqliteClient(database: Database): CloudflareSqlClient {
  const query = async (sql: string, params: readonly unknown[] = []) => {
    const statement = database.query(sql);
    const bindings = params.map((value) =>
      value instanceof Date ? value.getTime() : (value ?? null),
    ) as Parameters<typeof statement.all>;
    if (/^\s*SELECT/i.test(sql)) {
      const rows = statement.all(...bindings) as unknown[];
      return { rows, rowCount: rows.length };
    }
    const result = statement.run(...bindings) as { changes?: number };
    return { rows: [], rowCount: result.changes ?? 0 };
  };
  return { dialect: "sqlite", query: query as CloudflareSqlClient["query"] };
}

async function seedLegacyTable(recipient: string): Promise<string> {
  const dir = path.join(
    Bun.env.TMPDIR ?? "/tmp",
    `k-msg-migrate-${crypto.randomUUID()}`,
  );
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, "tracking.db");
  const database = new Database(file, { create: true });
  const client = sqliteClient(database);
  const requestedAt = new Date(Date.UTC(2026, 0, 1));
  await new HyperdriveDeliveryTrackingStore(client, TABLE).upsert({
    messageId: "msg-1",
    providerId: "iwinv",
    providerMessageId: "provider-1",
    type: "SMS",
    to: "01012345678",
    from: "0212345678",
    requestedAt,
    status: "SENT",
    statusUpdatedAt: requestedAt,
    attemptCount: 0,
    nextCheckAt: requestedAt,
  });
  for (const column of SECURE_COLUMNS) {
    await client.query(`ALTER TABLE ${TABLE} ADD COLUMN ${column}`);
  }
  database.run(`UPDATE ${TABLE} SET "to" = ?`, [recipient]);
  database.close();
  return file;
}

async function migrate(
  command: "plan" | "apply",
  file: string,
): Promise<{ exitCode: number; stdout: string }> {
  const proc = Bun.spawn(
    [
      process.execPath,
      CLI_ENTRY,
      "db",
      "tracking",
      "migrate",
      command,
      "--sqlite-file",
      file,
      ...(command === "apply"
        ? ["--snapshot-dir", path.join(path.dirname(file), "snapshots")]
        : []),
    ],
    {
      cwd: path.dirname(file),
      env: {
        ...process.env,
        KMSG_FIELD_CRYPTO_KEYS: JSON.stringify({ k1: KEY }),
        KMSG_ACTIVE_KID: "k1",
      },
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const [stdout, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  return { exitCode, stdout };
}

describe("db tracking migrate", () => {
  test(
    "apply exits 3 when the run fails",
    async () => {
      // An empty recipient cannot be encrypted, so the chunk fails.
      const file = await seedLegacyTable("");
      expect((await migrate("plan", file)).exitCode).toBe(0);

      const applied = await migrate("apply", file);
      expect(applied.stdout).toContain("status=failed");
      expect(applied.exitCode).toBe(3);
    },
    TEST_TIMEOUT,
  );

  test(
    "apply exits 0 when the run completes",
    async () => {
      const file = await seedLegacyTable("01012345678");
      expect((await migrate("plan", file)).exitCode).toBe(0);

      const applied = await migrate("apply", file);
      expect(applied.stdout).toContain("status=completed");
      expect(applied.exitCode).toBe(0);
    },
    TEST_TIMEOUT,
  );
});
