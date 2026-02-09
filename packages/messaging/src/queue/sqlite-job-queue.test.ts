import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { unlink } from "node:fs/promises";
import { JobStatus } from "./job-queue.interface";
import { SQLiteJobQueue } from "./sqlite-job-queue";

interface TestJobData {
  value?: number;
  foo?: string;
}

describe("SQLiteJobQueue", () => {
  let queue: SQLiteJobQueue<TestJobData>;
  const dbPath = "test-queue.sqlite";

  const cleanup = async () => {
    try {
      await unlink(dbPath);
    } catch {}
    try {
      await unlink(`${dbPath}-wal`);
    } catch {}
    try {
      await unlink(`${dbPath}-shm`);
    } catch {}
  };

  beforeEach(async () => {
    await cleanup();
    queue = new SQLiteJobQueue({ dbPath });
  });

  afterEach(async () => {
    queue.close();
    await cleanup();
  });

  test("should enqueue and dequeue a job", async () => {
    const jobData = { foo: "bar" };
    const job = await queue.enqueue("test-job", jobData);

    expect(job.id).toBeDefined();
    expect(job.data).toEqual(jobData);
    expect(job.status).toBe(JobStatus.PENDING);

    const dequeuedJob = await queue.dequeue();
    expect(dequeuedJob).toBeDefined();
    expect(dequeuedJob?.id).toBe(job.id);
    expect(dequeuedJob?.status).toBe(JobStatus.PROCESSING);
  });

  test("should respect priority", async () => {
    await queue.enqueue("low", {}, { priority: 1 });
    await queue.enqueue("high", {}, { priority: 10 });
    await queue.enqueue("medium", {}, { priority: 5 });

    const job1 = await queue.dequeue();
    expect(job1?.type).toBe("high");

    const job2 = await queue.dequeue();
    expect(job2?.type).toBe("medium");

    const job3 = await queue.dequeue();
    expect(job3?.type).toBe("low");
  });

  test("should persist jobs across restarts", async () => {
    await queue.enqueue("persist-job", { value: 123 });
    queue.close();

    const newQueue = new SQLiteJobQueue<TestJobData>({ dbPath });
    const job = await newQueue.peek();

    expect(job).toBeDefined();
    expect(job?.type).toBe("persist-job");
    expect(job?.data?.value).toBe(123);

    newQueue.close();
  });

  test("should handle completion", async () => {
    const job = await queue.enqueue("task", {});
    const dequeued = await queue.dequeue();

    if (!dequeued) throw new Error("Job not dequeued");

    await queue.complete(dequeued.id);

    const completedJob = await queue.getJob(dequeued.id);
    expect(completedJob?.status).toBe(JobStatus.COMPLETED);
    expect(completedJob?.completedAt).toBeDefined();
  });
});
