import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { SQL } from "bun";
import postgres from "postgres";
import type { DeliveryTrackingFieldCryptoOptions } from "../../delivery-tracking/store.interface";
import { BunSqlDeliveryTrackingStore } from "../../delivery-tracking/stores/bun-sql.store";
import type { TrackingRecord } from "../../delivery-tracking/types";
import { HyperdriveDeliveryTrackingStore } from "./hyperdrive-delivery-tracking.store";
import {
  type CloudflareSqlClient,
  createCloudflareSqlClient,
} from "./sql-client";

// Runs against real databases when KMSG_TEST_POSTGRES_URL or
// KMSG_TEST_MYSQL_URL (MySQL or MariaDB) names one. Each run creates its own
// tables and drops them.
const postgresUrl = process.env.KMSG_TEST_POSTGRES_URL;
const mysqlUrl = process.env.KMSG_TEST_MYSQL_URL;
const run = crypto.randomUUID().slice(0, 8);

const base = new Date("2026-09-27T01:02:03.456Z");
const at = (ms: number) => new Date(base.getTime() + ms);

type LeasingStore = Pick<
  HyperdriveDeliveryTrackingStore,
  | "init"
  | "upsert"
  | "get"
  | "listDue"
  | "leaseDue"
  | "patchLeased"
  | "releaseLeases"
>;

function dueRecord(messageId: string, nextCheckAt: Date): TrackingRecord {
  return {
    messageId,
    providerId: "mock",
    providerMessageId: `p-${messageId}`,
    type: "SMS",
    to: "01012345678",
    status: "SENT",
    requestedAt: at(-60_000),
    statusUpdatedAt: at(-60_000),
    attemptCount: 0,
    nextCheckAt,
  };
}

const ids = (records: TrackingRecord[]) =>
  records.map((record) => record.messageId).sort();

// Leases the oldest due records, stores a result and hands a lease back only
// through the lease that holds the record, and leases again once a lease
// runs out.
async function expectLeaseCycle(store: LeasingStore): Promise<void> {
  await store.init();
  for (const [index, messageId] of ["m0", "m1", "m2"].entries()) {
    await store.upsert(dueRecord(messageId, at(-3000 + index * 1000)));
  }
  await store.upsert({ ...dueRecord("done", at(-5000)), status: "DELIVERED" });
  const leaseUntil = at(300_000);

  expect(ids((await store.leaseDue(at(0), 2, leaseUntil)) ?? [])).toEqual([
    "m0",
    "m1",
  ]);
  expect((await store.get("m0"))?.nextCheckAt).toEqual(leaseUntil);

  expect(
    await store.patchLeased("m0", at(1), { providerStatusCode: "late" }),
  ).toBe(false);
  expect(
    await store.patchLeased("m0", leaseUntil, {
      providerStatusCode: "held",
      nextCheckAt: leaseUntil,
    }),
  ).toBe(true);
  expect((await store.get("m0"))?.providerStatusCode).toBe("held");
  expect(ids((await store.leaseDue(at(0), 10, leaseUntil)) ?? [])).toEqual([
    "m2",
  ]);
  expect(await store.leaseDue(at(0), 10, leaseUntil)).toEqual([]);

  await store.releaseLeases(["m0", "m1"], at(1), at(0));
  expect(await store.listDue(at(0), 10)).toEqual([]);
  await store.releaseLeases(["m0"], leaseUntil, at(0));
  expect(ids(await store.listDue(at(0), 10))).toEqual(["m0"]);

  expect(
    ids((await store.leaseDue(at(300_000), 10, at(600_000))) ?? []),
  ).toEqual(["m0", "m1", "m2"]);
}

// Two connections leasing at the same time never get the same record.
async function expectDisjointLeases(
  first: LeasingStore,
  second: LeasingStore,
): Promise<void> {
  await first.init();
  await second.init();
  for (let index = 0; index < 20; index += 1) {
    await first.upsert(dueRecord(`c${index}`, at(-20_000 + index)));
  }

  const [a, b] = await Promise.all([
    first.leaseDue(at(0), 10, at(300_000)),
    second.leaseDue(at(0), 10, at(300_001)),
  ]);

  const leased = [...ids(a ?? []), ...ids(b ?? [])];
  expect(new Set(leased).size).toBe(leased.length);
  expect(leased).toHaveLength(20);
}

// Field crypto that marks what it encrypts, so it can be read back.
const fieldCrypto: DeliveryTrackingFieldCryptoOptions = {
  config: {
    enabled: true,
    fields: { to: "encrypt+hash", from: "encrypt+hash", metadata: "encrypt" },
    provider: {
      encrypt: async ({ value }) => ({ ciphertext: `enc:${value}` }),
      decrypt: async ({ ciphertext }) => ciphertext.slice(4),
      hash: async ({ value }) => `h:${value}`,
    },
  },
};

// A patch of encrypted fields rewrites the whole record, and only under the
// lease that holds it.
async function expectEncryptedLeasedPatch(store: LeasingStore): Promise<void> {
  await store.init();
  await store.upsert({
    ...dueRecord("e1", at(-1000)),
    from: "01000000000",
    metadata: { note: "sent" },
  });
  const leaseUntil = at(300_000);
  expect(ids((await store.leaseDue(at(0), 10, leaseUntil)) ?? [])).toEqual([
    "e1",
  ]);

  const patch = { status: "FAILED" as const, metadata: { note: "failed" } };
  expect(await store.patchLeased("e1", at(1), patch)).toBe(false);
  expect(await store.get("e1")).toMatchObject({
    status: "SENT",
    metadata: { note: "sent" },
  });

  expect(await store.patchLeased("e1", leaseUntil, patch)).toBe(true);
  expect(await store.get("e1")).toMatchObject({
    status: "FAILED",
    metadata: { note: "failed" },
    to: "01012345678",
    from: "01000000000",
    nextCheckAt: leaseUntil,
  });
}

function postgresJsClient(sql: postgres.Sql): CloudflareSqlClient {
  return createCloudflareSqlClient({
    dialect: "postgres",
    query: async <T>(statement: string, params: readonly unknown[] = []) => {
      const rows = await sql.unsafe<T[]>(
        statement,
        params as postgres.ParameterOrJSON<never>[],
      );
      return { rows, rowCount: rows.count };
    },
  });
}

describe.skipIf(!postgresUrl)("leases on a real Postgres", () => {
  const schema = `kmsg_lease_${run}`;
  const clients: postgres.Sql[] = [];
  const connect = () => {
    const sql = postgres(postgresUrl ?? "", {
      max: 1,
      onnotice: () => {},
      connection: { search_path: schema },
    });
    clients.push(sql);
    return sql;
  };

  beforeAll(async () => {
    const bootstrap = postgres(postgresUrl ?? "", {
      max: 1,
      onnotice: () => {},
    });
    await bootstrap.unsafe(`CREATE SCHEMA "${schema}"`);
    await bootstrap.end();
  });

  afterAll(async () => {
    await connect().unsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await Promise.all(clients.map((sql) => sql.end()));
  });

  for (const timestamp of ["bigint", "date"] as const) {
    test(`leases, hands back, and re-leases with ${timestamp} timestamps`, async () => {
      await expectLeaseCycle(
        new HyperdriveDeliveryTrackingStore(postgresJsClient(connect()), {
          tableName: `cycle_${timestamp}`,
          typeStrategy: { timestamp },
        }),
      );
    });
  }

  for (const timestamp of ["bigint", "date"] as const) {
    test(`stores an encrypted leased patch under its lease with ${timestamp} timestamps`, async () => {
      await expectEncryptedLeasedPatch(
        new HyperdriveDeliveryTrackingStore(postgresJsClient(connect()), {
          tableName: `encrypted_${timestamp}`,
          typeStrategy: { timestamp },
          fieldCrypto,
        }),
      );
    });
  }

  test("an encrypted leased patch leaves a record another poll leased while it was read", async () => {
    const inner = postgresJsClient(connect());
    // Runs once, right after the next SELECT returns.
    let afterRead: (() => Promise<unknown>) | undefined;
    const client: CloudflareSqlClient = {
      dialect: "postgres",
      query: (async (statement: string, params?: readonly unknown[]) => {
        const result = await inner.query(statement, params);
        const next = afterRead;
        if (next && statement.startsWith("SELECT ")) {
          afterRead = undefined;
          await next();
        }
        return result;
      }) as CloudflareSqlClient["query"],
    };
    const store = new HyperdriveDeliveryTrackingStore(client, {
      tableName: "encrypted_race",
      fieldCrypto,
    });
    await store.init();
    await store.upsert({
      ...dueRecord("e1", at(-1000)),
      metadata: { note: "sent" },
    });
    const leaseA = at(1000);
    await store.leaseDue(at(0), 10, leaseA);

    // A's lease runs out, and B leases the record while A reads it.
    const leaseB = at(5000);
    afterRead = () => store.leaseDue(at(2000), 10, leaseB);
    expect(
      await store.patchLeased("e1", leaseA, {
        status: "FAILED",
        metadata: { note: "stale" },
      }),
    ).toBe(false);
    expect(await store.get("e1")).toMatchObject({
      status: "SENT",
      metadata: { note: "sent" },
      nextCheckAt: leaseB,
    });
  });

  test("two connections leasing at once get different records", async () => {
    const options = { tableName: "concurrent" };
    await expectDisjointLeases(
      new HyperdriveDeliveryTrackingStore(postgresJsClient(connect()), options),
      new HyperdriveDeliveryTrackingStore(postgresJsClient(connect()), options),
    );
  });
});

describe.skipIf(!mysqlUrl)("leases on a real MySQL or MariaDB", () => {
  const clients: SQL[] = [];
  const tables: string[] = [];
  // One connection each, so the isolation level set here is the one the
  // store's queries and transactions run at.
  const connect = async (isolation: string) => {
    const sql = new Bun.SQL({ url: mysqlUrl ?? "", max: 1 });
    clients.push(sql);
    await sql.unsafe(`SET SESSION TRANSACTION ISOLATION LEVEL ${isolation}`);
    return sql;
  };
  const table = (name: string) => {
    const tableName = `kmsg_lease_${run}_${name}`;
    tables.push(tableName);
    return tableName;
  };

  afterAll(async () => {
    const admin = new Bun.SQL({ url: mysqlUrl ?? "", max: 1 });
    for (const tableName of tables) {
      await admin.unsafe(`DROP TABLE IF EXISTS \`${tableName}\``);
    }
    await admin.close();
    await Promise.all(clients.map((sql) => sql.close()));
  });

  for (const isolation of ["REPEATABLE READ", "READ COMMITTED"]) {
    const suffix = isolation === "READ COMMITTED" ? "rc" : "rr";

    test(`leases, hands back, and re-leases at ${isolation}`, async () => {
      await expectLeaseCycle(
        new BunSqlDeliveryTrackingStore({
          sql: await connect(isolation),
          tableName: table(`cycle_${suffix}`),
        }),
      );
    });

    test(`stores an encrypted leased patch under its lease at ${isolation}`, async () => {
      await expectEncryptedLeasedPatch(
        new BunSqlDeliveryTrackingStore({
          sql: await connect(isolation),
          tableName: table(`encrypted_${suffix}`),
          fieldCrypto,
        }),
      );
    });

    test(`two connections leasing at once get different records at ${isolation}`, async () => {
      const options = { tableName: table(`concurrent_${suffix}`) };
      await expectDisjointLeases(
        new BunSqlDeliveryTrackingStore({
          sql: await connect(isolation),
          ...options,
        }),
        new BunSqlDeliveryTrackingStore({
          sql: await connect(isolation),
          ...options,
        }),
      );
    });
  }
});
