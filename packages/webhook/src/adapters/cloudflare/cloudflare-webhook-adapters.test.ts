import { Database, type SQLQueryBindings } from "bun:sqlite";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  setSystemTime,
  test,
} from "bun:test";
import { WebhookEndpointConflictError } from "../../runtime/errors";
import { createInMemoryWebhookPersistence } from "../../runtime/persistence";
import type { WebhookEndpointStore } from "../../runtime/types";
import { WebhookRuntimeService } from "../../runtime/webhook-runtime.service";
import type { HttpClient } from "../../services/webhook.dispatcher";
import {
  type WebhookConfig,
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookEvent,
  WebhookEventType,
} from "../../types/webhook.types";
import type { D1DatabaseLike } from "./d1-client";
import { buildWebhookSchemaSql, createD1WebhookPersistence } from "./index";

class RecordingHttpClient implements HttpClient {
  readonly calls: Array<{ url: string; options: RequestInit }> = [];

  async fetch(url: string, options: RequestInit): Promise<Response> {
    this.calls.push({ url, options });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
}

function createConfig(): WebhookConfig {
  return {
    maxRetries: 0,
    retryDelayMs: 10,
    timeoutMs: 500,
    enableSecurity: false,
    enabledEvents: [
      WebhookEventType.MESSAGE_SENT,
      WebhookEventType.SYSTEM_MAINTENANCE,
    ],
    batchSize: 10,
    batchTimeoutMs: 50,
  };
}

function createEvent(): WebhookEvent {
  return {
    id: `evt_${Date.now()}`,
    type: WebhookEventType.MESSAGE_SENT,
    timestamp: new Date(),
    data: { ok: true },
    metadata: {
      providerId: "provider-a",
    },
    version: "1.0",
  };
}

function createSqliteBackedD1(options: { reportChanges?: boolean } = {}): {
  db: D1DatabaseLike;
  close: () => void;
} {
  const sqlite = new Database(":memory:");
  const reportChanges = options.reportChanges ?? true;

  const db: D1DatabaseLike = {
    prepare(query: string) {
      let params: SQLQueryBindings[] = [];
      return {
        bind(...values: unknown[]) {
          params = values as SQLQueryBindings[];
          return this;
        },
        async first<T extends Record<string, unknown>>() {
          const statement = sqlite.query(query);
          const row = statement.get(...params) as T | null;
          return row ?? null;
        },
        async all<T extends Record<string, unknown>>() {
          const statement = sqlite.query(query);
          const rows = statement.all(...params) as T[];
          return { results: rows };
        },
        async run() {
          const statement = sqlite.query(query);
          const { changes } = statement.run(...params);
          // D1 returns a D1Result whose meta counts the changed rows.
          return reportChanges
            ? { success: true, meta: { changes } }
            : undefined;
        },
      };
    },
    // Like D1, exec runs each line as its own statement.
    async exec(query: string) {
      for (const line of query.split("\n")) {
        if (line.trim()) sqlite.exec(line);
      }
      return undefined;
    },
  };

  return {
    db,
    close: () => sqlite.close(),
  };
}

describe("webhook cloudflare adapter", () => {
  const closers: Array<() => void> = [];

  afterEach(() => {
    while (closers.length > 0) {
      const close = closers.pop();
      if (close) {
        close();
      }
    }
  });

  test("buildWebhookSchemaSql renders endpoint and delivery tables", () => {
    const sql = buildWebhookSchemaSql({
      endpointTableName: "endpoints_custom",
      deliveryTableName: "deliveries_custom",
    }).join("\n");

    expect(sql).toContain("endpoints_custom");
    expect(sql).toContain("deliveries_custom");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS");
    expect(sql).toContain("ON deliveries_custom(created_at DESC, id DESC)");
  });

  test("D1 delivery store replaces a stored delivery by id", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);
    const { deliveryStore } = createD1WebhookPersistence(sqliteD1.db);
    const delivery: WebhookDelivery = {
      id: "d-1",
      endpointId: "ep-1",
      eventId: "evt-1",
      eventType: WebhookEventType.MESSAGE_SENT,
      url: "https://example.com/hook",
      httpMethod: "POST",
      headers: {},
      payload: "before",
      attempts: [],
      status: "success",
      createdAt: new Date(),
    };

    await deliveryStore.add(delivery);
    await deliveryStore.replace?.({ ...delivery, payload: "after" });

    const stored = await deliveryStore.list({ endpointId: "ep-1" });
    expect(stored.map((saved) => saved.payload)).toEqual(["after"]);
  });

  test("D1 delivery store pages newest first with the before cursor", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);
    const { deliveryStore } = createD1WebhookPersistence(sqliteD1.db);
    const createdAt = new Date(Date.UTC(2026, 0, 1));
    for (const id of ["d-1", "d-2", "d-3"]) {
      await deliveryStore.add({
        id,
        endpointId: "ep-1",
        eventId: `evt-${id}`,
        eventType: WebhookEventType.MESSAGE_SENT,
        url: "https://example.com/hook",
        httpMethod: "POST",
        headers: {},
        payload: id,
        attempts: [],
        status: "success",
        createdAt,
      });
    }

    const first = await deliveryStore.list({ limit: 2 });
    const last = first.at(-1);
    if (!last) throw new Error("first page is empty");
    const second = await deliveryStore.list({
      limit: 2,
      before: { createdAt: last.createdAt, id: last.id },
    });

    expect(first.map((delivery) => delivery.id)).toEqual(["d-3", "d-2"]);
    expect(second.map((delivery) => delivery.id)).toEqual(["d-1"]);
  });

  test("D1 persistence works with WebhookRuntimeService", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);

    const runtime = new WebhookRuntimeService({
      delivery: createConfig(),
      persistence: createD1WebhookPersistence(sqliteD1.db),
      security: {
        allowPrivateHosts: true,
      },
      httpClient: new RecordingHttpClient(),
    });

    try {
      const endpoint = await runtime.addEndpoint({
        url: "http://127.0.0.1:8787/receiver",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      });

      const listed = await runtime.listEndpoints();
      expect(listed.length).toBe(1);
      expect(listed[0]?.id).toBe(endpoint.id);

      const deliveries = await runtime.emitSync(createEvent());
      expect(deliveries.length).toBe(1);

      const saved = await runtime.listDeliveries({ endpointId: endpoint.id });
      expect(saved.length).toBe(1);
      expect(saved[0]?.endpointId).toBe(endpoint.id);
    } finally {
      await runtime.shutdown();
    }
  });
});

function createStoredEndpoint(
  overrides: Partial<WebhookEndpoint> & Pick<WebhookEndpoint, "id" | "url">,
): WebhookEndpoint {
  const now = new Date();
  return {
    active: true,
    status: "active",
    events: [WebhookEventType.MESSAGE_SENT],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe.each([
  [
    "in-memory",
    () => ({
      store: createInMemoryWebhookPersistence().endpointStore,
      close: () => {},
    }),
  ],
  [
    "D1",
    () => {
      const sqliteD1 = createSqliteBackedD1();
      return {
        store: createD1WebhookPersistence(sqliteD1.db).endpointStore,
        close: sqliteD1.close,
      };
    },
  ],
])("%s endpoint store", (_name, createStore) => {
  let store: WebhookEndpointStore;
  let close: () => void;

  beforeEach(() => {
    ({ store, close } = createStore());
  });

  afterEach(() => {
    close();
  });

  test("add rejects a URL that is already registered and keeps the stored endpoint", async () => {
    await store.add(
      createStoredEndpoint({
        id: "first",
        url: "https://example.com/hook",
        secret: "whsec_first",
      }),
    );

    const error = await store
      .add(
        createStoredEndpoint({
          id: "second",
          url: "https://example.com/hook",
          secret: "whsec_second",
        }),
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WebhookEndpointConflictError);
    expect(error).toMatchObject({ field: "url", endpointId: "first" });
    expect((await store.list()).map((endpoint) => endpoint.id)).toEqual([
      "first",
    ]);
    expect((await store.get("first"))?.secret).toBe("whsec_first");
  });

  test("add rejects an id that is already registered", async () => {
    await store.add(
      createStoredEndpoint({ id: "hook", url: "https://example.com/a" }),
    );

    const error = await store
      .add(createStoredEndpoint({ id: "hook", url: "https://example.com/b" }))
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WebhookEndpointConflictError);
    expect(error).toMatchObject({ field: "id", endpointId: "hook" });
    expect((await store.get("hook"))?.url).toBe("https://example.com/a");
  });

  test("update rejects a URL another endpoint uses and keeps both", async () => {
    await store.add(
      createStoredEndpoint({ id: "a", url: "https://example.com/a" }),
    );
    await store.add(
      createStoredEndpoint({ id: "b", url: "https://example.com/b" }),
    );

    const error = await store
      .update(
        "a",
        createStoredEndpoint({ id: "a", url: "https://example.com/b" }),
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(WebhookEndpointConflictError);
    expect(error).toMatchObject({ field: "url", endpointId: "b" });
    expect((await store.get("a"))?.url).toBe("https://example.com/a");
    expect((await store.get("b"))?.url).toBe("https://example.com/b");
  });

  test("update keeps the stored id when the endpoint names another", async () => {
    await store.add(
      createStoredEndpoint({ id: "a", url: "https://example.com/a" }),
    );

    await store.update(
      "a",
      createStoredEndpoint({ id: "b", url: "https://example.com/a2" }),
    );

    expect(await store.get("a")).toMatchObject({
      id: "a",
      url: "https://example.com/a2",
    });
    expect(await store.get("b")).toBeNull();
  });

  test("update rejects an id that is not stored", async () => {
    await expect(
      store.update(
        "missing",
        createStoredEndpoint({ id: "missing", url: "https://example.com/m" }),
      ),
    ).rejects.toThrow("not found");
    expect(await store.list()).toHaveLength(0);
  });

  test("changing an object after add(), get() or list() leaves the store alone", async () => {
    const added = createStoredEndpoint({
      id: "a",
      url: "https://example.com/a",
    });
    await store.add(added);
    await store.add(
      createStoredEndpoint({ id: "b", url: "https://example.com/b" }),
    );

    added.url = "https://example.com/b";
    const fetched = await store.get("b");
    if (fetched) {
      fetched.url = "https://example.com/a";
      fetched.events.push(WebhookEventType.MESSAGE_FAILED);
    }
    const [listed] = await store.list();
    if (listed) listed.id = "c";

    expect((await store.get("a"))?.url).toBe("https://example.com/a");
    expect(await store.get("b")).toMatchObject({
      url: "https://example.com/b",
      events: [WebhookEventType.MESSAGE_SENT],
    });
    expect(await store.get("c")).toBeNull();
  });

  test("update changes an endpoint in place", async () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    await store.add(
      createStoredEndpoint({
        id: "a",
        url: "https://example.com/a",
        secret: "whsec_old",
        createdAt,
        updatedAt: createdAt,
      }),
    );

    const updatedAt = new Date("2026-02-01T00:00:00.000Z");
    await store.update(
      "a",
      createStoredEndpoint({
        id: "a",
        url: "https://example.com/a-moved",
        secret: "whsec_new",
        events: [WebhookEventType.MESSAGE_FAILED],
        createdAt,
        updatedAt,
      }),
    );

    expect(await store.get("a")).toMatchObject({
      url: "https://example.com/a-moved",
      secret: "whsec_new",
      events: [WebhookEventType.MESSAGE_FAILED],
      createdAt,
      updatedAt,
    });
    expect(await store.list()).toHaveLength(1);
  });
});

// Another request removes the endpoint just before this store's UPDATE runs.
function removeBeforeUpdate(
  db: D1DatabaseLike,
  endpointId: string,
): D1DatabaseLike {
  return {
    prepare(query: string) {
      const statement = db.prepare(query);
      if (!query.trimStart().startsWith("UPDATE")) return statement;
      const remove = () =>
        db
          .prepare("DELETE FROM kmsg_webhook_endpoints WHERE id = ?")
          .bind(endpointId)
          .run();
      return {
        bind(...values: unknown[]) {
          statement.bind(...values);
          return this;
        },
        async first<T extends Record<string, unknown>>() {
          await remove();
          return statement.first<T>();
        },
        async all<T extends Record<string, unknown>>() {
          await remove();
          return statement.all<T>();
        },
        async run() {
          await remove();
          return statement.run();
        },
      };
    },
  };
}

describe.each([
  ["reports changed rows", true],
  ["reports no changed rows", false],
])("D1 endpoint store on a database that %s", (_label, reportChanges) => {
  test("update rejects an endpoint removed while it runs", async () => {
    const sqliteD1 = createSqliteBackedD1({ reportChanges });
    try {
      const { endpointStore } = createD1WebhookPersistence(sqliteD1.db);
      await endpointStore.add(
        createStoredEndpoint({ id: "a", url: "https://example.com/a" }),
      );
      const racing = createD1WebhookPersistence(
        removeBeforeUpdate(sqliteD1.db, "a"),
      ).endpointStore;

      await expect(
        racing.update(
          "a",
          createStoredEndpoint({ id: "a", url: "https://example.com/a2" }),
        ),
      ).rejects.toThrow("not found");
      expect(await endpointStore.list()).toHaveLength(0);
    } finally {
      sqliteD1.close();
    }
  });
});

// The INSERT commits, then the client reports a failure, as a lost D1
// connection can.
function failAfterInsert(db: D1DatabaseLike): D1DatabaseLike {
  return {
    prepare(query: string) {
      const statement = db.prepare(query);
      if (!query.trimStart().startsWith("INSERT")) return statement;
      return {
        bind(...values: unknown[]) {
          statement.bind(...values);
          return this;
        },
        first: () => statement.first(),
        all: () => statement.all(),
        async run() {
          await statement.run();
          throw new Error("Network connection lost");
        },
      };
    },
  };
}

describe("D1 endpoint store errors", () => {
  test("an insert that committed before the client failed is not reported as a conflict", async () => {
    const sqliteD1 = createSqliteBackedD1();
    try {
      const { endpointStore } = createD1WebhookPersistence(
        failAfterInsert(sqliteD1.db),
      );

      const error = await endpointStore
        .add(createStoredEndpoint({ id: "a", url: "https://example.com/a" }))
        .catch((caught: unknown) => caught);

      expect(error).not.toBeInstanceOf(WebhookEndpointConflictError);
      expect((error as Error).message).toBe("Network connection lost");
    } finally {
      sqliteD1.close();
    }
  });
});

// The database rejects this store's INSERT or UPDATE, and another request
// removes the endpoint that held the id or URL before the store looks it up.
function removeOwnerAfterRejection(
  db: D1DatabaseLike,
  ownerId: string,
): D1DatabaseLike {
  let removed = false;
  return {
    prepare(query: string) {
      const statement = db.prepare(query);
      if (!/^\s*(INSERT|UPDATE)\b/.test(query)) return statement;
      return {
        bind(...values: unknown[]) {
          statement.bind(...values);
          return this;
        },
        first: () => statement.first(),
        all: () => statement.all(),
        async run() {
          try {
            return await statement.run();
          } catch (error) {
            if (!removed) {
              removed = true;
              await db
                .prepare("DELETE FROM kmsg_webhook_endpoints WHERE id = ?")
                .bind(ownerId)
                .run();
            }
            throw error;
          }
        },
      };
    },
  };
}

describe("D1 endpoint store when the endpoint holding an id or URL is removed in between", () => {
  const closers: Array<() => void> = [];

  afterEach(() => {
    while (closers.length > 0) closers.pop()?.();
  });

  function setUp(stored: WebhookEndpoint[], ownerId: string) {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);
    const { endpointStore } = createD1WebhookPersistence(sqliteD1.db);
    const racing = createD1WebhookPersistence(
      removeOwnerAfterRejection(sqliteD1.db, ownerId),
    ).endpointStore;
    return {
      racing,
      async seed() {
        for (const endpoint of stored) await endpointStore.add(endpoint);
      },
      async rows() {
        return (await endpointStore.list())
          .map((endpoint) => [endpoint.id, endpoint.url])
          .sort();
      },
    };
  }

  test.each([
    ["URL", "first", "second", "https://example.com/hook"],
    ["id", "hook", "hook", "https://example.com/new"],
  ])(
    "add stores the endpoint once the %s is free again",
    async (_field, ownerId, id, url) => {
      const { racing, seed, rows } = setUp(
        [
          createStoredEndpoint({
            id: ownerId,
            url: "https://example.com/hook",
          }),
        ],
        ownerId,
      );
      await seed();

      await racing.add(createStoredEndpoint({ id, url }));

      expect(await rows()).toEqual([[id, url]]);
    },
  );

  test("update moves the endpoint once the URL is free again", async () => {
    const { racing, seed, rows } = setUp(
      [
        createStoredEndpoint({ id: "a", url: "https://example.com/a" }),
        createStoredEndpoint({ id: "b", url: "https://example.com/b" }),
      ],
      "b",
    );
    await seed();

    await racing.update(
      "a",
      createStoredEndpoint({ id: "a", url: "https://example.com/b" }),
    );

    expect(await rows()).toEqual([["a", "https://example.com/b"]]);
  });

  test("a rejection that no stored id or URL explains is reported after a few tries", async () => {
    const sqliteD1 = createSqliteBackedD1();
    closers.push(sqliteD1.close);
    const { endpointStore } = createD1WebhookPersistence(sqliteD1.db);
    await endpointStore.add(
      createStoredEndpoint({
        id: "a",
        url: "https://example.com/a",
        name: "shared",
      }),
    );
    // A unique index the store does not know about, as a custom schema can add.
    await sqliteD1.db.exec?.(
      "CREATE UNIQUE INDEX kmsg_webhook_endpoints_name ON kmsg_webhook_endpoints (name)",
    );
    let inserts = 0;
    const counting: D1DatabaseLike = {
      prepare(query: string) {
        if (query.trimStart().startsWith("INSERT")) inserts += 1;
        return sqliteD1.db.prepare(query);
      },
    };

    const error = await createD1WebhookPersistence(counting)
      .endpointStore.add(
        createStoredEndpoint({
          id: "b",
          url: "https://example.com/b",
          name: "shared",
        }),
      )
      .catch((caught: unknown) => caught);

    expect(error).not.toBeInstanceOf(WebhookEndpointConflictError);
    expect((error as Error).message).toContain("UNIQUE constraint failed");
    expect(inserts).toBe(3);
  });
});

describe("D1 endpoint store conflicts in the same millisecond", () => {
  afterEach(() => {
    setSystemTime();
  });

  test("two runtimes adding one endpoint at the same moment get a conflict", async () => {
    setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
    const sqliteD1 = createSqliteBackedD1();
    try {
      const input = {
        id: "hook",
        url: "https://example.com/hook",
        active: true,
        events: [WebhookEventType.MESSAGE_SENT],
      };
      const runtimes = [0, 1].map(
        () =>
          new WebhookRuntimeService({
            delivery: createConfig(),
            persistence: createD1WebhookPersistence(sqliteD1.db),
            httpClient: new RecordingHttpClient(),
            autoStart: false,
          }),
      );

      await runtimes[0]?.addEndpoint(input);
      // Same id, URL and creation time as the stored row, but this INSERT
      // failed, so the row is not this call's.
      const error = await runtimes[1]
        ?.addEndpoint(input)
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(WebhookEndpointConflictError);
    } finally {
      sqliteD1.close();
    }
  });
});
