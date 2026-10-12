import { afterEach, expect, test } from "bun:test";
import { KMsgErrorCode, type Provider } from "@k-msg/core";
import { MessageStatus } from "../types/message.types";
import { MessageJobProcessor } from "./job.processor";
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
  expect((await q.getJob(id))?.data.__kmsgDelivery["0"].result).toBeUndefined();
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
  expect((await q.getJob(id))?.data[1].__kmsgDelivery["0"].result.status).toBe(
    MessageStatus.SENT,
  );
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
