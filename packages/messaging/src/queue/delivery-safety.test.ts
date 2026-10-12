import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { KMsgErrorCode, type Provider } from "@k-msg/core";
import {
  CloudflareObjectJobQueue,
  createDurableObjectJobQueue,
  createR2JobQueue,
} from "../adapters/cloudflare";
import { MessageStatus } from "../types/message.types";
import { MessageJobProcessor, MessageJobTooLargeError } from "./job.processor";
import { JobCheckpointLostError, JobStatus } from "./job-queue.interface";
import { MessageRetryHandler } from "./retry.handler";
import { SQLiteJobQueue } from "./sqlite-job-queue";

const queues: SQLiteJobQueue<any>[] = [];
afterEach(() => {
  for (const q of queues.splice(0)) q.close();
});
const queue = () => {
  const q = new SQLiteJobQueue<any>({ dbPath: ":memory:" });
  queues.push(q);
  return q;
};
const request = {
  templateId: "example",
  recipients: [{ phoneNumber: "01000000001" }, { phoneNumber: "01000000002" }],
  variables: {},
};
// Drive the real dequeue/complete/fail path deterministically without timers.
const tick = async (p: MessageJobProcessor) => {
  await (p as unknown as { processJobs(): Promise<void> }).processJobs();
  await p.stop();
};
const success = (messageId: string) => ({
  isSuccess: true,
  value: { messageId, status: "SENT" },
});

test("partial retries survive processor replacement and never resend successful recipients", async () => {
  const q = queue();
  const sent: { to: string; messageId: string }[] = [];
  const provider = {
    id: "stub",
    send: async (input: { to: string; messageId: string }) => {
      sent.push(input);
      return sent.length === 2
        ? {
            isSuccess: false,
            error: {
              code: KMsgErrorCode.RATE_LIMIT_EXCEEDED,
              message: "rate limit",
            },
          }
        : success(input.messageId);
    },
  } as unknown as Provider;
  const first = new MessageJobProcessor(
    provider,
    { retryDelays: [0], concurrency: 1 },
    q,
  );
  const id = await first.queueMessage(structuredClone(request));
  await tick(first);
  expect((await q.getJob(id))?.status).toBe(JobStatus.PENDING);
  const second = new MessageJobProcessor(
    provider,
    { retryDelays: [0], concurrency: 1 },
    q,
  );
  await tick(second);
  expect((await q.getJob(id))?.status).toBe(JobStatus.COMPLETED);
  expect(sent.map((x) => x.to)).toEqual([
    "01000000001",
    "01000000002",
    "01000000002",
  ]);
  expect(sent[1]?.messageId).toBe(sent[2]?.messageId);
});

test("lost result checkpoint leaves an unknown receipt that is never sent again", async () => {
  const q = queue();
  const checkpoint = q.checkpoint.bind(q);
  let writes = 0;
  let sends = 0;
  q.checkpoint = async (...args) => {
    if (++writes === 2) throw new Error("storage unavailable");
    await checkpoint(...args);
  };
  const provider = {
    id: "stub",
    send: async () => {
      sends++;
      return success("sent");
    },
  } as unknown as Provider;
  const p = new MessageJobProcessor(
    provider,
    { retryDelays: [0], concurrency: 1 },
    q,
  );
  const id = await p.queueMessage({
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
  });
  await tick(p);
  await tick(p);
  expect(sends).toBe(1);
  expect((await q.getJob(id))?.status).toBe(JobStatus.FAILED);
  expect(
    (await q.getJob(id))?.data.__kmsgDelivery.receipts["0"].status,
  ).toBeUndefined();
});

test("old attempts cannot overwrite saved progress", async () => {
  const q = queue();
  const job = await q.enqueue("test", {});
  const claimed = (await q.dequeue())!;
  await q.checkpoint(job.id, { saved: true }, claimed.attempts);
  await q.fail(job.id, "retry", { enabled: true, delayMs: 0 });
  await q.dequeue();
  await expect(
    q.checkpoint(job.id, { saved: false }, claimed.attempts),
  ).rejects.toThrow();
  expect((await q.getJob(job.id))?.data).toEqual({ saved: true });
});

test("completion listeners cannot turn a delivered job into a retry", async () => {
  const q = queue();
  let sends = 0;
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async () => {
        sends++;
        return success("sent");
      },
    } as unknown as Provider,
    { retryDelays: [0], concurrency: 1 },
    q,
  );
  p.on("job:completed", () => {
    throw new Error("observer");
  });
  const id = await p.queueMessage({
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
  });
  await tick(p);
  await tick(p);
  expect(sends).toBe(1);
  expect((await q.getJob(id))?.status).toBe(JobStatus.COMPLETED);
  expect(p.getMetrics().succeeded).toBe(1);
  expect(p.getMetrics().failed).toBe(0);
});

for (const observer of ["callback", "event"])
  test(`successful retry survives throwing ${observer}`, async () => {
    let sends = 0;
    let successes = 0;
    const handler = new MessageRetryHandler({
      policy: {
        maxAttempts: 4,
        backoffMultiplier: 1,
        initialDelay: 0,
        maxDelay: 0,
        jitter: false,
        retryableStatuses: [MessageStatus.FAILED],
        retryableErrorCodes: ["NETWORK_TIMEOUT"],
      },
      checkInterval: 10,
      maxQueueSize: 10,
      execute: async () => {
        sends++;
        return {};
      },
      onRetrySuccess: async () => {
        if (observer === "callback") throw new Error("observer");
      },
    });
    handler.on("retry:success", () => {
      successes++;
    });
    if (observer === "event")
      handler.on("retry:success", () => {
        throw new Error("observer");
      });
    await handler.addForRetry({
      messageId: "m",
      phoneNumber: "01000000001",
      status: MessageStatus.FAILED,
      attempts: [
        {
          attemptNumber: 1,
          attemptedAt: new Date(),
          status: MessageStatus.FAILED,
          error: { code: "NETWORK_TIMEOUT", message: "timeout" },
          provider: "stub",
        },
      ],
      metadata: { templateId: "t" },
    });
    const item = handler.getRetryStatus("m")!;
    await (
      handler as unknown as { processRetryItem(item: unknown): Promise<void> }
    ).processRetryItem(item);
    expect(successes).toBe(1);
    expect(item.status).toBe("succeeded");
    expect(sends).toBe(1);
    expect(handler.getMetrics().successfulRetries).toBe(1);
    expect(handler.getMetrics().failedRetries).toBe(0);
  });

test("checkpointing preserves caller provider options and correlation identifiers", async () => {
  let sent: Record<string, unknown> | undefined;
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async (input: Record<string, unknown>) => {
        sent = input;
        return success("sent");
      },
    } as unknown as Provider,
    { concurrency: 1 },
    queue(),
  );
  const legacyOptions = {
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
    options: {
      priority: "normal" as const,
      providerOptions: {
        requestId: "caller-id",
        correlationId: "caller-correlation",
        custom: true,
      },
    },
  };
  await p.queueMessage(legacyOptions);
  await tick(p);
  expect(sent?.providerOptions).toMatchObject({
    requestId: "caller-id",
    correlationId: "caller-correlation",
    custom: true,
    attempt: 1,
  });
});

test("a stale processor cannot fail the new owner's attempt after losing its checkpoint fence", async () => {
  const q = queue();
  let id = "";
  let sends = 0;
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async () => {
        sends++;
        // Simulate another worker settling an expired lease and taking the job.
        await q.fail(id, "lease expired", { enabled: true, delayMs: 0 });
        const next = await q.dequeue();
        expect(next?.attempts).toBe(1);
        return success("sent");
      },
    } as unknown as Provider,
    { concurrency: 1, retryDelays: [0] },
    q,
  );
  id = await p.queueMessage({
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
  });
  await tick(p);
  const current = await q.getJob(id);
  expect(current?.status).toBe(JobStatus.PROCESSING);
  expect(current?.attempts).toBe(1);
  expect(sends).toBe(1);
  expect(p.getMetrics()).toMatchObject({
    activeJobs: 0,
    failed: 0,
    retried: 0,
  });
  await expect(q.checkpoint(id, {}, 0)).rejects.toBeInstanceOf(
    JobCheckpointLostError,
  );
});

test("a permanent failure in a bulk entry does not drop later entries", async () => {
  const q = queue();
  let sends = 0;
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async () => {
        sends++;
        return success("sent");
      },
    } as unknown as Provider,
    { concurrency: 1 },
    q,
  );
  const id = await p.queueBulkMessages([
    {
      ...structuredClone(request),
      templateId: "",
      recipients: [request.recipients[0]!],
    },
    { ...structuredClone(request), recipients: [request.recipients[1]!] },
  ]);
  await tick(p);
  expect(sends).toBe(1);
  expect((await q.getJob(id))?.status).toBe(JobStatus.FAILED);
  expect(
    (await q.getJob(id))?.data[1].__kmsgDelivery.receipts["0"].status,
  ).toBe(MessageStatus.SENT);
});

test("public job and processing events do not expose saved receipt bookkeeping", async () => {
  const q = queue();
  const events: unknown[] = [];
  const p = new MessageJobProcessor(
    { id: "stub", send: async () => success("sent") } as unknown as Provider,
    { concurrency: 1 },
    q,
  );
  p.on("message:processing", (value) => events.push(value));
  p.on("job:completed", (value) => events.push(value));
  const id = await p.queueMessage({
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
  });
  await tick(p);
  expect(JSON.stringify(events)).not.toContain("__kmsgDelivery");
  expect((await q.getJob(id))?.data.__kmsgDelivery).toBeDefined();
});

const recipientsOf = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    phoneNumber: `010${String(10000000 + i)}`,
    metadata: { ref: `order-${i}` },
  }));
const okProvider = (sent: string[] = []) =>
  ({
    id: "stub",
    send: async (input: { to: string; messageId: string }) => {
      sent.push(input.to);
      return success(input.messageId);
    },
  }) as unknown as Provider;

test("one checkpoint per recipient plus one for the last result, and compact receipts", async () => {
  const q = queue();
  const saved: string[] = [];
  const checkpoint = q.checkpoint.bind(q);
  q.checkpoint = async (id, data, attempt) => {
    saved.push(JSON.stringify(data));
    await checkpoint(id, data, attempt);
  };
  const p = new MessageJobProcessor(okProvider(), { concurrency: 1 }, q);
  const count = 25;
  const id = await p.queueMessage({
    ...structuredClone(request),
    recipients: recipientsOf(count),
  });
  await tick(p);
  expect(saved).toHaveLength(count + 1);
  const stored = (await q.getJob(id))!.data;
  const receipts = Object.values(stored.__kmsgDelivery.receipts) as {
    id: string;
    status: string;
  }[];
  expect(receipts).toHaveLength(count);
  for (const receipt of receipts) {
    expect(receipt.status).toBe(MessageStatus.SENT);
    // No copy of the recipient, its metadata or the provider's response.
    expect(JSON.stringify(receipt).length).toBeLessThan(120);
    expect(JSON.stringify(receipt)).not.toContain("order-");
  }
  // The row grows by the receipts only.
  const recipientBytes = JSON.stringify(recipientsOf(count)).length;
  expect(saved.at(-1)!.length - saved[0]!.length).toBeLessThan(
    count * 120 + recipientBytes,
  );
});

test("a job reports the recipient that failed and why, without personal data", async () => {
  const q = queue();
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async (input: { to: string; messageId: string }) =>
        input.to === "01000000002"
          ? {
              isSuccess: false,
              error: {
                code: KMsgErrorCode.INVALID_REQUEST,
                message: "bad number 01000000002",
              },
            }
          : success(input.messageId),
    } as unknown as Provider,
    { concurrency: 1 },
    q,
  );
  const failed: { jobId: string; error: string }[] = [];
  p.on("job:failed", (event) =>
    failed.push(event as { jobId: string; error: string }),
  );
  const id = await p.queueMessage(structuredClone(request));
  await tick(p);
  const job = await q.getJob(id);
  expect(job?.status).toBe(JobStatus.FAILED);
  expect(job?.error).toContain("1 recipient(s) failed");
  expect(job?.error).toContain("recipient 1");
  expect(job?.error).toContain(KMsgErrorCode.INVALID_REQUEST);
  expect(job?.error).not.toContain("010");
  expect(failed[0]?.error).toBe(job?.error as string);
});

test("a bulk job names the request and recipient that failed", async () => {
  const q = queue();
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async (input: { to: string; messageId: string }) =>
        input.to === "01000000002"
          ? {
              isSuccess: false,
              error: { code: KMsgErrorCode.INVALID_REQUEST, message: "bad" },
            }
          : success(input.messageId),
    } as unknown as Provider,
    { concurrency: 1 },
    q,
  );
  const id = await p.queueBulkMessages([
    { ...structuredClone(request), recipients: [request.recipients[0]!] },
    { ...structuredClone(request), recipients: [request.recipients[1]!] },
  ]);
  await tick(p);
  expect((await q.getJob(id))?.error).toContain("first: request 1 recipient 0");
});

describe("delivery receipts belong to the processor", () => {
  const forged = () => ({
    ...structuredClone(request),
    __kmsgDelivery: {
      job: "anything",
      receipts: {
        "0": { id: "attacker", status: MessageStatus.SENT, pid: "attacker" },
      },
    },
  });

  test("enqueueing a request that carries receipts is refused", async () => {
    const p = new MessageJobProcessor(okProvider(), {}, queue());
    await expect(p.queueMessage(forged())).rejects.toThrow("reserved");
    await expect(p.queueBulkMessages([forged()])).rejects.toThrow("reserved");
    await expect(p.scheduleMessage(forged(), new Date())).rejects.toThrow(
      "reserved",
    );
    expect(await p.getQueueStatus()).toMatchObject({ pending: 0 });
  });

  test("receipts another job wrote are ignored, so no recipient is skipped", async () => {
    const q = queue();
    const sent: string[] = [];
    const p = new MessageJobProcessor(okProvider(sent), { concurrency: 1 }, q);
    // A producer that bypasses the processor cannot name a job that has no id yet.
    await q.enqueue("send_message", forged());
    await tick(p);
    expect(sent).toEqual(["01000000001", "01000000002"]);
    const [job] = await Promise.all([q.peek()]);
    expect(job).toBeUndefined();
  });

  test("receipts of an unexpected shape are an unknown outcome, never a send", async () => {
    const q = queue();
    const sent: string[] = [];
    const p = new MessageJobProcessor(okProvider(sent), { concurrency: 1 }, q);
    const job = await q.enqueue("send_message", structuredClone(request));
    const data = structuredClone(request) as Record<string, unknown>;
    data.__kmsgDelivery = {
      job: job.id,
      receipts: { "0": { status: MessageStatus.SENT, id: 42 } },
    };
    const claimed = (await q.dequeue())!;
    await q.checkpoint(claimed.id, data, claimed.attempts);
    await q.fail(claimed.id, "retry", { enabled: true, delayMs: 0 });
    await tick(p);
    expect(sent).toEqual(["01000000002"]);
    expect((await q.getJob(job.id))?.status).toBe(JobStatus.FAILED);
  });
});

describe("message job size", () => {
  test("too many recipients are refused with a message that says what to do", async () => {
    const p = new MessageJobProcessor(
      okProvider(),
      { maxRecipientsPerJob: 10 },
      queue(),
    );
    const error = await p
      .queueMessage({
        ...structuredClone(request),
        recipients: recipientsOf(11),
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MessageJobTooLargeError);
    expect((error as Error).message).toContain("at most 10 recipients");
    expect((error as Error).message).toContain("split");
    // The count covers every request of a bulk job.
    await expect(
      p.queueBulkMessages([
        { ...structuredClone(request), recipients: recipientsOf(6) },
        { ...structuredClone(request), recipients: recipientsOf(6) },
      ]),
    ).rejects.toBeInstanceOf(MessageJobTooLargeError);
    await p.queueMessage({
      ...structuredClone(request),
      recipients: recipientsOf(10),
    });
  });

  test("a payload over the byte limit is refused, by default under D1's row limit", async () => {
    const p = new MessageJobProcessor(okProvider(), {}, queue());
    await expect(
      p.queueMessage({
        ...structuredClone(request),
        recipients: [
          {
            phoneNumber: "01000000001",
            metadata: { note: "x".repeat(1_100_000) },
          },
        ],
      }),
    ).rejects.toThrow("bytes");
    // The default recipient limit leaves a full job well under 2 MB.
    const full = {
      ...structuredClone(request),
      recipients: recipientsOf(1000),
    };
    expect(JSON.stringify(full).length + 1000 * 160).toBeLessThan(2_000_000);
    await p.queueMessage(full);
  });

  test("an oversized job put straight into the queue fails before it sends, without retries", async () => {
    const q = queue();
    const sent: string[] = [];
    const p = new MessageJobProcessor(
      okProvider(sent),
      { maxRecipientsPerJob: 1, retryDelays: [0] },
      q,
    );
    const id = (await q.enqueue("send_message", structuredClone(request))).id;
    await tick(p);
    const job = await q.getJob(id);
    expect(sent).toEqual([]);
    expect(job?.status).toBe(JobStatus.FAILED);
    expect(job?.attempts).toBe(1);
    expect(job?.error).toContain("at most 1 recipients");
  });
});

test("an empty from does not hide the sender number", async () => {
  let sent: Record<string, unknown> | undefined;
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async (input: Record<string, unknown>) => {
        sent = input;
        return success("sent");
      },
    } as unknown as Provider,
    { concurrency: 1 },
    queue(),
  );
  await p.queueMessage({
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
    options: { from: "", senderNumber: "029999999" } as never,
  });
  await tick(p);
  expect(sent?.from).toBe("029999999");
});

test("a queue that returns no job metadata still sends", async () => {
  const q = queue();
  const dequeue = q.dequeue.bind(q);
  q.dequeue = async (options) => {
    const job = await dequeue(options);
    if (job) (job as { metadata?: unknown }).metadata = undefined;
    return job;
  };
  const sent: string[] = [];
  const p = new MessageJobProcessor(okProvider(sent), { concurrency: 1 }, q);
  const id = await p.queueMessage({
    ...structuredClone(request),
    recipients: [request.recipients[0]!],
  });
  await tick(p);
  expect(sent).toEqual(["01000000001"]);
  expect((await q.getJob(id))?.status).toBe(JobStatus.COMPLETED);
});

test("the caller's providerOptions.requestId reaches the provider; the per-recipient messageId is the idempotency handle", async () => {
  const seen: Record<string, unknown>[] = [];
  const p = new MessageJobProcessor(
    {
      id: "stub",
      send: async (input: Record<string, unknown>) => {
        seen.push(input);
        return success(String(input.messageId));
      },
    } as unknown as Provider,
    { concurrency: 1 },
    queue(),
  );
  await p.queueMessage({
    ...structuredClone(request),
    options: { providerOptions: { requestId: "caller-id" } } as never,
  });
  await tick(p);
  expect(
    seen.map(
      (input) => (input.providerOptions as { requestId: string }).requestId,
    ),
  ).toEqual(["caller-id", "caller-id"]);
  // One caller id for the whole job: the provider-level handle is messageId.
  expect(new Set(seen.map((input) => input.messageId)).size).toBe(2);
});

describe("lease renewal and attempt fences", () => {
  afterEach(() => setSystemTime());

  test("a long job keeps its lease because every checkpoint renews it", async () => {
    setSystemTime(new Date("2026-10-01T00:00:00Z"));
    const q = new SQLiteJobQueue<any>({ dbPath: ":memory:", leaseMs: 1000 });
    queues.push(q);
    const other: unknown[] = [];
    const p = new MessageJobProcessor(
      {
        id: "stub",
        send: async (input: { messageId: string }) => {
          // Each send takes most of the lease; together they take 4 leases.
          setSystemTime(new Date(Date.now() + 800));
          other.push(await q.dequeue());
          return success(input.messageId);
        },
      } as unknown as Provider,
      { concurrency: 1 },
      q,
    );
    const id = await p.queueMessage({
      ...structuredClone(request),
      recipients: recipientsOf(5),
    });
    await tick(p);
    expect(other.every((job) => job === undefined)).toBe(true);
    const job = await q.getJob(id);
    expect(job?.status).toBe(JobStatus.COMPLETED);
    expect(job?.attempts).toBe(0);
  });

  test("a stale worker cannot complete or fail the job of the attempt that took it over", async () => {
    const q = queue();
    const job = await q.enqueue("send_message", {});
    await q.dequeue();
    await q.fail(job.id, "lease expired", { enabled: true, delayMs: 0 });
    await q.dequeue();
    await expect(
      q.complete(job.id, undefined, { attempt: 0 }),
    ).rejects.toBeInstanceOf(JobCheckpointLostError);
    await expect(
      q.fail(job.id, "late", { enabled: false }, { attempt: 0 }),
    ).rejects.toBeInstanceOf(JobCheckpointLostError);
    const current = await q.getJob(job.id);
    expect(current?.status).toBe(JobStatus.PROCESSING);
    expect(current?.attempts).toBe(1);
    await q.fail(job.id, "mine", { enabled: false }, { attempt: 1 });
    expect((await q.getJob(job.id))?.status).toBe(JobStatus.FAILED);
  });

  test("a processor whose attempt was taken over settles nothing", async () => {
    const q = queue();
    let id = "";
    const p = new MessageJobProcessor(
      {
        id: "stub",
        send: async (input: { messageId: string }) => {
          // Another worker takes the job after this attempt's last checkpoint.
          await q.fail(id, "lease expired", { enabled: true, delayMs: 0 });
          await q.dequeue();
          return success(input.messageId);
        },
      } as unknown as Provider,
      { concurrency: 1, retryDelays: [0] },
      q,
    );
    id = await p.queueMessage({
      ...structuredClone(request),
      recipients: [request.recipients[0]!],
    });
    await tick(p);
    // The final checkpoint is lost, and nothing else touches the new owner's job.
    const current = await q.getJob(id);
    expect(current?.status).toBe(JobStatus.PROCESSING);
    expect(current?.attempts).toBe(1);
    expect(p.getMetrics()).toMatchObject({
      succeeded: 0,
      failed: 0,
      retried: 0,
    });
  });
});

test("object queues other than Durable Object storage refuse message jobs", () => {
  const noop = async () => {};
  const r2 = createR2JobQueue({
    get: async () => null,
    put: noop,
    delete: noop,
    list: async () => ({ objects: [] }),
  });
  expect(r2.supportsCheckpoints).toBe(false);
  expect(() => new MessageJobProcessor(okProvider(), {}, r2)).toThrow(
    "checkpoint support",
  );
  const custom = new CloudflareObjectJobQueue({
    get: async () => null,
    put: noop,
    delete: noop,
    list: async () => [],
  });
  expect(custom.supportsCheckpoints).toBe(false);
  const durable = createDurableObjectJobQueue({
    get: async () => undefined,
    put: noop,
    delete: async () => true,
    list: async () => new Map(),
  });
  expect(durable.supportsCheckpoints).toBe(true);
  expect(
    () => new MessageJobProcessor(okProvider(), {}, durable),
  ).not.toThrow();
});

test("a throwing failure observer does not skip the others", async () => {
  const calls: string[] = [];
  const handler = new MessageRetryHandler({
    policy: {
      maxAttempts: 2,
      backoffMultiplier: 1,
      initialDelay: 0,
      maxDelay: 0,
      jitter: false,
      retryableStatuses: [MessageStatus.FAILED],
      retryableErrorCodes: ["NETWORK_TIMEOUT"],
    },
    checkInterval: 10,
    maxQueueSize: 10,
    execute: async () => {
      throw new Error("still down");
    },
    onRetryFailed: async () => {
      calls.push("onRetryFailed");
      throw new Error("observer");
    },
    onRetryExhausted: async () => {
      calls.push("onRetryExhausted");
      throw new Error("observer");
    },
  });
  handler.on("retry:failed", () => {
    calls.push("retry:failed");
    throw new Error("observer");
  });
  handler.on("retry:exhausted", () => {
    calls.push("retry:exhausted");
  });
  await handler.addForRetry({
    messageId: "m",
    phoneNumber: "01000000001",
    status: MessageStatus.FAILED,
    attempts: [
      {
        attemptNumber: 1,
        attemptedAt: new Date(),
        status: MessageStatus.FAILED,
        error: { code: "NETWORK_TIMEOUT", message: "timeout" },
        provider: "stub",
      },
    ],
    metadata: { templateId: "t" },
  });
  const item = handler.getRetryStatus("m")!;
  await (
    handler as unknown as { processRetryItem(item: unknown): Promise<void> }
  ).processRetryItem(item);
  expect(calls).toEqual([
    "onRetryFailed",
    "retry:failed",
    "onRetryExhausted",
    "retry:exhausted",
  ]);
  expect(item.status).toBe("exhausted");
});
