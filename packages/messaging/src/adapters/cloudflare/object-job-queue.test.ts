import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { JobProcessor } from "../../queue/job.processor";
import { JobStatus } from "../../queue/job-queue.interface";
import {
  type CloudflareObjectJob,
  CloudflareObjectJobQueue,
  createDurableObjectJobQueue,
  JOB_LEASE_EXPIRED,
} from "./index";
import type { CloudflareDurableObjectStorageLike } from "./object-storage";

const START = new Date("2026-09-26T00:00:00.000Z").getTime();

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function at(offsetMs: number): Date {
  return new Date(START + offsetMs);
}

// Behaves like Durable Object storage: sorted keys, at most `limit` entries
// per list() call, `startAfter` paging. Counts the calls it serves.
class DurableObjectStorageFake implements CloudflareDurableObjectStorageLike {
  readonly data = new Map<string, unknown>();
  readonly puts = new Map<string, number>();
  gets = 0;
  lists = 0;
  /** Called on every list(), for example to let time pass during a scan. */
  onList?: () => void;
  /** Values longer than this are rejected, as storage rejects oversized values. */
  maxValueLength = Number.POSITIVE_INFINITY;
  /** Keys whose writes are not read back, as KV may read its own writes late. */
  readonly unseenWrites = new Set<string>();
  /** When each key was last written. */
  readonly writtenAt = new Map<string, number>();
  /** Called after every put(), for example to let time pass during a write. */
  onPut?: () => void;

  async get<T>(key: string): Promise<T | undefined> {
    this.gets += 1;
    return this.data.get(key) as T | undefined;
  }

  async put<T>(key: string, value: T): Promise<void> {
    if (String(value).length > this.maxValueLength) {
      throw new RangeError("Values cannot be larger than the storage limit");
    }
    this.puts.set(key, (this.puts.get(key) ?? 0) + 1);
    this.writtenAt.set(key, Date.now());
    if (!this.unseenWrites.has(key)) this.data.set(key, value);
    this.onPut?.();
  }

  async delete(key: string): Promise<boolean> {
    return this.data.delete(key);
  }

  async list<T>(
    options: { prefix?: string; startAfter?: string; limit?: number } = {},
  ): Promise<Map<string, T>> {
    this.lists += 1;
    this.onList?.();
    const prefix = options.prefix ?? "";
    const entries = Array.from(this.data.entries())
      .filter(([key]) => key.startsWith(prefix))
      .filter(([key]) => !options.startAfter || key > options.startAfter)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(0, options.limit ?? Number.POSITIVE_INFINITY);
    return new Map(entries) as Map<string, T>;
  }
}

function queueWith<T>(
  options: Parameters<typeof createDurableObjectJobQueue<T>>[1] = {},
) {
  const storage = new DurableObjectStorageFake();
  return { storage, queue: createDurableObjectJobQueue<T>(storage, options) };
}

afterEach(() => {
  setSystemTime();
});

describe("CloudflareObjectJobQueue leases", () => {
  test("a dequeued job is due again once its lease expires, as a failed attempt", async () => {
    setSystemTime(at(0));
    const expired: CloudflareObjectJob<{ to: string }>[] = [];
    const { queue } = queueWith<{ to: string }>({
      leaseMs: 60_000,
      onLeaseExpired: (job) => {
        expired.push(job);
      },
    });
    const job = await queue.enqueue("send", { to: "01012345678" });

    const first = await queue.dequeue();
    expect(first?.status).toBe(JobStatus.PROCESSING);
    expect(first?.leaseExpiresAt).toEqual(at(60_000));

    setSystemTime(at(59_999));
    expect(await queue.dequeue()).toBeUndefined();
    expect(expired).toHaveLength(0);

    setSystemTime(at(60_000));
    const again = await queue.dequeue();
    expect(again?.id).toBe(job.id);
    expect(again?.status).toBe(JobStatus.PROCESSING);
    expect(again?.attempts).toBe(1);
    expect(again?.error).toBe(JOB_LEASE_EXPIRED);
    expect(again?.leaseExpiresAt).toEqual(at(120_000));
    expect(
      expired.map((item) => [item.id, item.status, item.attempts]),
    ).toEqual([[job.id, JobStatus.PENDING, 1]]);
  });

  test("a job whose lease expires with no attempts left fails", async () => {
    setSystemTime(at(0));
    const expired: CloudflareObjectJob<{ to: string }>[] = [];
    const { queue } = queueWith<{ to: string }>({
      leaseMs: 1_000,
      onLeaseExpired: (job) => {
        expired.push(job);
      },
    });
    const job = await queue.enqueue(
      "send",
      { to: "01012345678" },
      { maxAttempts: 1 },
    );
    await queue.dequeue();

    setSystemTime(at(1_000));
    expect(await queue.dequeue()).toBeUndefined();

    const stored = await queue.getJob(job.id);
    expect(stored?.status).toBe(JobStatus.FAILED);
    expect(stored?.attempts).toBe(1);
    expect(stored?.error).toBe(JOB_LEASE_EXPIRED);
    expect(stored?.failedAt).toEqual(at(1_000));
    expect(stored?.leaseExpiresAt).toBeUndefined();
    expect(expired.map((item) => item.status)).toEqual([JobStatus.FAILED]);
  });

  test("leases are off unless leaseMs is set", async () => {
    setSystemTime(at(0));
    const { queue } = queueWith<{ to: string }>();
    const job = await queue.enqueue("send", { to: "01012345678" });

    expect((await queue.dequeue())?.leaseExpiresAt).toBeUndefined();
    setSystemTime(at(365 * 24 * 60 * 60_000));
    expect(await queue.dequeue()).toBeUndefined();
    expect((await queue.getJob(job.id))?.status).toBe(JobStatus.PROCESSING);
    expect(await queue.nextDueAt()).toBeUndefined();
  });

  test("leaseMs: Infinity keeps a dequeued job processing", async () => {
    setSystemTime(at(0));
    const { queue } = queueWith<{ to: string }>({
      leaseMs: Number.POSITIVE_INFINITY,
    });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();

    setSystemTime(at(365 * 24 * 60 * 60_000));
    expect(await queue.dequeue()).toBeUndefined();
    expect((await queue.getJob(job.id))?.status).toBe(JobStatus.PROCESSING);
    expect(await queue.nextDueAt()).toBeUndefined();
  });

  test("rejects a lease that is not a positive number of milliseconds", () => {
    const storage = new DurableObjectStorageFake();
    for (const leaseMs of [0, -1, Number.NaN, 1e20, "60000"]) {
      expect(() =>
        createDurableObjectJobQueue(storage, { leaseMs: leaseMs as number }),
      ).toThrow(RangeError);
    }
  });

  test("a job left processing without a lease gets one when first seen", async () => {
    setSystemTime(at(0));
    const { storage, queue } = queueWith<{ to: string }>({ leaseMs: 60_000 });
    const job = await queue.enqueue("send", { to: "01012345678" });
    // What earlier versions, or a queue without leaseMs, stored: processing,
    // without a lease, maybe still being worked on.
    const key = `kmsg/jobs/jobs/${job.id}`;
    const stored = JSON.parse(String(storage.data.get(key)));
    storage.data.set(
      key,
      JSON.stringify({ ...stored, status: JobStatus.PROCESSING }),
    );

    setSystemTime(at(10_000));
    // Due now, so that dequeue() gives it a lease.
    expect(await queue.nextDueAt()).toEqual(at(10_000));
    expect(await queue.dequeue()).toBeUndefined();
    expect((await queue.getJob(job.id))?.leaseExpiresAt).toEqual(at(70_000));
    expect(await queue.nextDueAt()).toEqual(at(70_000));

    setSystemTime(at(69_999));
    expect(await queue.dequeue()).toBeUndefined();
    setSystemTime(at(70_000));
    expect((await queue.dequeue())?.id).toBe(job.id);
  });

  test("onLeaseExpired runs once the job is stored pending again, before dequeue() leases one", async () => {
    setSystemTime(at(0));
    const seen: Array<string | undefined> = [];
    const { storage, queue } = queueWith<{ to: string }>({
      leaseMs: 1_000,
      onLeaseExpired: async (job) => {
        const stored = JSON.parse(
          String(storage.data.get(`kmsg/jobs/jobs/${job.id}`)),
        );
        seen.push(stored.status);
      },
    });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();

    setSystemTime(at(1_000));
    expect((await queue.dequeue())?.id).toBe(job.id);

    expect(seen).toEqual([JobStatus.PENDING]);
  });

  test("without onLeaseExpired, a job taken again at once is written once", async () => {
    setSystemTime(at(0));
    const { storage, queue } = queueWith<{ to: string }>({ leaseMs: 1_000 });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();
    storage.puts.clear();

    setSystemTime(at(1_000));
    expect((await queue.dequeue())?.id).toBe(job.id);

    // One write rather than one for the recovery and one for the new lease.
    expect(storage.puts.get(`kmsg/jobs/jobs/${job.id}`)).toBe(1);
  });

  test("the lease dequeue() returns starts after onLeaseExpired has run", async () => {
    setSystemTime(at(0));
    const { queue } = queueWith<{ to: string }>({
      leaseMs: 1_000,
      // A slow callback: time passes while it runs.
      onLeaseExpired: () => {
        setSystemTime(at(5_000));
      },
    });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();

    setSystemTime(at(1_000));
    const again = await queue.dequeue();

    expect(again?.id).toBe(job.id);
    expect(again?.leaseExpiresAt).toEqual(at(6_000));
  });

  test("dequeue() does not hand out a job another dequeue() took while onLeaseExpired ran", async () => {
    setSystemTime(at(0));
    let other: CloudflareObjectJob<{ to: string }> | undefined;
    let calls = 0;
    const { queue } = queueWith<{ to: string }>({
      leaseMs: 1_000,
      // In a Durable Object, a callback that waits on anything but storage
      // lets another request's dequeue() run in between.
      onLeaseExpired: async () => {
        calls += 1;
        if (calls === 1) other = await queue.dequeue();
      },
    });
    const first = await queue.enqueue(
      "send",
      { to: "01000000001" },
      { priority: 1 },
    );
    await queue.dequeue();
    const second = await queue.enqueue("send", { to: "01000000002" });

    setSystemTime(at(1_000));
    const taken = await queue.dequeue();

    expect([other?.id, taken?.id].sort()).toEqual([first.id, second.id].sort());
    expect((await queue.getJob(first.id))?.status).toBe(JobStatus.PROCESSING);
    expect((await queue.getJob(second.id))?.status).toBe(JobStatus.PROCESSING);
  });

  test("dequeue() looks for a job at most twice when its writes read back late", async () => {
    setSystemTime(at(0));
    let calls = 0;
    const { storage, queue } = queueWith<{ to: string }>({
      leaseMs: 1_000,
      onLeaseExpired: () => {
        calls += 1;
      },
    });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();
    storage.unseenWrites.add(`kmsg/jobs/jobs/${job.id}`);
    // Fails the test rather than hanging it if dequeue() keeps looking.
    storage.lists = 0;
    storage.onList = () => {
      if (storage.lists > 20) throw new Error("dequeue() kept looking");
    };

    setSystemTime(at(1_000));

    expect(await queue.dequeue()).toBeUndefined();
    expect(calls).toBe(2);
  });

  test("dequeue() leaves the jobs its caller is still running alone, even once their lease expired", async () => {
    setSystemTime(at(0));
    const expired: string[] = [];
    const { queue } = queueWith<{ to: string }>({
      leaseMs: 1_000,
      onLeaseExpired: (job) => {
        expired.push(job.id);
      },
    });
    const running = await queue.enqueue(
      "send",
      { to: "01000000001" },
      { priority: 1 },
    );
    await queue.dequeue();
    const waiting = await queue.enqueue("send", { to: "01000000002" });

    setSystemTime(at(5_000));
    const next = await queue.dequeue({ running: new Set([running.id]) });

    expect(next?.id).toBe(waiting.id);
    const stored = await queue.getJob(running.id);
    expect(stored?.status).toBe(JobStatus.PROCESSING);
    expect(stored?.attempts).toBe(0);
    expect(stored?.error).toBeUndefined();
    expect(stored?.leaseExpiresAt).toEqual(at(1_000));
    expect(expired).toEqual([]);
  });

  test("the lease dequeue() returns starts when it stores it, not when the scan began", async () => {
    setSystemTime(at(0));
    const { storage, queue } = queueWith<{ to: string }>({ leaseMs: 60_000 });
    await queue.enqueue("send", { to: "01012345678" });
    // A slow scan: time passes while the jobs are listed.
    let elapsed = 0;
    storage.onList = () => {
      elapsed += 30_000;
      setSystemTime(at(elapsed));
    };

    const job = await queue.dequeue();

    expect(job?.leaseExpiresAt?.getTime()).toBeGreaterThanOrEqual(
      at(elapsed + 60_000).getTime(),
    );
  });

  test("each lease dequeue() stores starts when it is written, after the writes before it", async () => {
    setSystemTime(at(0));
    const { storage, queue } = queueWith<{ to: string }>({ leaseMs: 1_000 });
    const released = await queue.enqueue("send", { to: "01000000001" });
    await queue.dequeue();
    // Left processing without a lease, as by an earlier version.
    const legacy = await queue.enqueue("send", { to: "01000000002" });
    const legacyKey = `kmsg/jobs/jobs/${legacy.id}`;
    storage.data.set(
      legacyKey,
      JSON.stringify({
        ...JSON.parse(String(storage.data.get(legacyKey))),
        status: JobStatus.PROCESSING,
      }),
    );
    const selected = await queue.enqueue(
      "send",
      { to: "01000000003" },
      { priority: 1 },
    );

    setSystemTime(at(1_000));
    // Slow writes: each takes 600 ms.
    let elapsed = 1_000;
    storage.onPut = () => {
      elapsed += 600;
      setSystemTime(at(elapsed));
    };

    const taken = await queue.dequeue();

    expect(taken?.id).toBe(selected.id);
    expect((await queue.getJob(released.id))?.status).toBe(JobStatus.PENDING);
    for (const job of [selected, legacy]) {
      const writtenAt = storage.writtenAt.get(`kmsg/jobs/jobs/${job.id}`);
      expect((await queue.getJob(job.id))?.leaseExpiresAt?.getTime()).toBe(
        (writtenAt ?? Number.NaN) + 1_000,
      );
    }
  });

  test("with leases off, size() and peek() leave a stored lease alone, as dequeue() does", async () => {
    setSystemTime(at(0));
    const { storage, queue } = queueWith<{ to: string }>({ leaseMs: 1_000 });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();
    // The same storage, reopened without leases.
    const unleased = createDurableObjectJobQueue<{ to: string }>(storage);

    setSystemTime(at(5_000));
    expect(await unleased.size()).toBe(0);
    expect(await unleased.peek()).toBeUndefined();
    expect(await unleased.dequeue()).toBeUndefined();
    expect((await unleased.getJob(job.id))?.status).toBe(JobStatus.PROCESSING);
  });

  test("size() and peek() count a job whose lease expired, without changing it", async () => {
    setSystemTime(at(0));
    const { queue } = queueWith<{ to: string }>({ leaseMs: 1_000 });
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();
    expect(await queue.size()).toBe(0);
    expect(await queue.peek()).toBeUndefined();

    setSystemTime(at(1_000));
    expect(await queue.size()).toBe(1);
    const next = await queue.peek();
    expect(next?.id).toBe(job.id);
    expect(next?.status).toBe(JobStatus.PENDING);
    expect(next?.attempts).toBe(1);
    expect((await queue.getJob(job.id))?.status).toBe(JobStatus.PROCESSING);
  });

  test("fail() leaves a completed job completed", async () => {
    const { queue } = queueWith<{ to: string }>();
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();
    await queue.complete(job.id);

    // A worker whose lease expired reports late.
    await queue.fail(job.id, "NETWORK_TIMEOUT", { enabled: true });

    const stored = await queue.getJob(job.id);
    expect(stored?.status).toBe(JobStatus.COMPLETED);
    expect(stored?.attempts).toBe(0);
  });
});

describe("CloudflareObjectJobQueue scheduling and cleanup", () => {
  test("nextDueAt() is the earliest delayed job or lease expiry", async () => {
    setSystemTime(at(0));
    const { queue } = queueWith<{ to: string }>({ leaseMs: 60_000 });
    expect(await queue.nextDueAt()).toBeUndefined();

    await queue.enqueue("send", { to: "1" }, { delay: 30_000 });
    await queue.enqueue("send", { to: "2" }, { delay: 90_000 });
    expect(await queue.nextDueAt()).toEqual(at(30_000));

    const due = await queue.enqueue("send", { to: "3" });
    expect(await queue.nextDueAt()).toEqual(at(0));

    // Leased until 60 s, before the 90 s job but after the 30 s one.
    await queue.dequeue();
    expect(await queue.nextDueAt()).toEqual(at(30_000));

    setSystemTime(at(30_000));
    const delayed = await queue.dequeue();
    await queue.complete(due.id);
    await queue.complete(delayed?.id ?? "");
    expect(await queue.nextDueAt()).toEqual(at(90_000));
  });

  test("cleanupTerminal({ olderThan }) keeps jobs that finished since", async () => {
    setSystemTime(at(0));
    const { queue } = queueWith<{ to: string }>();
    const completedEarly = await queue.enqueue("send", { to: "1" });
    const failedEarly = await queue.enqueue("send", { to: "2" });
    const completedLate = await queue.enqueue("send", { to: "3" });
    const pending = await queue.enqueue("send", { to: "4" }, { delay: 1_000 });

    await queue.complete(completedEarly.id);
    setSystemTime(at(10_000));
    await queue.fail(failedEarly.id, "INVALID_REQUEST");
    setSystemTime(at(20_000));
    await queue.complete(completedLate.id);

    expect(await queue.cleanupTerminal({ olderThan: at(15_000) })).toBe(2);
    expect(await queue.getJob(completedEarly.id)).toBeUndefined();
    expect(await queue.getJob(failedEarly.id)).toBeUndefined();
    expect((await queue.getJob(completedLate.id))?.status).toBe(
      JobStatus.COMPLETED,
    );
    expect((await queue.getJob(pending.id))?.status).toBe(JobStatus.PENDING);

    // The statuses list still works, alone or with olderThan.
    expect(
      await queue.cleanupTerminal({
        statuses: [JobStatus.FAILED],
        olderThan: at(30_000),
      }),
    ).toBe(0);
    expect(await queue.cleanupTerminal([JobStatus.COMPLETED])).toBe(1);
  });

  test("cleanupTerminal() rejects an invalid olderThan instead of removing everything", async () => {
    const { queue } = queueWith<{ to: string }>();
    const job = await queue.enqueue("send", { to: "1" });
    await queue.complete(job.id);

    await expect(
      queue.cleanupTerminal({ olderThan: new Date(Number.NaN) }),
    ).rejects.toThrow(TypeError);
    expect(await queue.getJob(job.id)).toBeDefined();
  });

  test("complete() completes a job whose result cannot be stored", async () => {
    const { storage, queue } = queueWith<{ to: string }>();
    const unserializable = await queue.enqueue("send", { to: "1" });
    const oversized = await queue.enqueue("send", { to: "2" });
    storage.maxValueLength = 2_000;

    await queue.complete(unserializable.id, { count: 1n });
    await queue.complete(oversized.id, { report: "x".repeat(5_000) });

    for (const id of [unserializable.id, oversized.id]) {
      const stored = await queue.getJob(id);
      expect(stored?.status).toBe(JobStatus.COMPLETED);
      expect(stored?.result).toBeUndefined();
    }
  });

  test("complete() keeps the result it is given", async () => {
    const { queue } = queueWith<{ to: string }>();
    const job = await queue.enqueue("send", { to: "01012345678" });
    await queue.dequeue();

    await queue.complete(job.id, { providerMessageId: "p-1" });

    const stored = await queue.getJob(job.id);
    expect(stored?.result).toEqual({ providerMessageId: "p-1" });
    expect(stored?.leaseExpiresAt).toBeUndefined();
  });

  test("a queue built with a key prefix string still works", async () => {
    const storage = new DurableObjectStorageFake();
    const queue = new CloudflareObjectJobQueue<{ to: string }>(
      {
        get: async (key) => (storage.data.get(key) as string) ?? null,
        put: async (key, value) => {
          storage.data.set(key, value);
        },
        delete: async (key) => {
          storage.data.delete(key);
        },
        list: async (prefix) =>
          Array.from(storage.data.keys()).filter((key) =>
            key.startsWith(prefix),
          ),
      },
      "app/jobs",
    );

    const job = await queue.enqueue("send", { to: "1" });

    expect(storage.data.has(`app/jobs/jobs/${job.id}`)).toBe(true);
    expect((await queue.dequeue())?.id).toBe(job.id);
  });
});

describe("CloudflareObjectJobQueue with JobProcessor", () => {
  test("a job whose handler outlives its lease is neither run again nor counted as lost", async () => {
    const expired: string[] = [];
    const { queue } = queueWith<{ to: string }>({
      leaseMs: 20,
      onLeaseExpired: (job) => {
        expired.push(job.id);
      },
    });
    const processor = new JobProcessor(
      {
        concurrency: 2,
        retryDelays: [0],
        maxRetries: 3,
        pollInterval: 5,
        enableMetrics: false,
      },
      queue,
    );
    let runs = 0;
    processor.handle("send", async () => {
      runs += 1;
      await wait(100);
      return "sent";
    });
    const job = await queue.enqueue("send", { to: "01012345678" });

    processor.start();
    // The lease has run out; the handler is still running.
    await wait(60);
    const midway = await queue.getJob(job.id);
    expect(midway?.status).toBe(JobStatus.PROCESSING);
    expect(midway?.attempts).toBe(0);
    await processor.stop();

    const stored = await queue.getJob(job.id);
    expect(runs).toBe(1);
    expect(stored?.status).toBe(JobStatus.COMPLETED);
    expect(stored?.attempts).toBe(0);
    expect(stored?.error).toBeUndefined();
    expect(expired).toEqual([]);
  });
});
