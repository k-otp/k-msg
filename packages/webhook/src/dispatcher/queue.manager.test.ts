import { describe, expect, spyOn, test } from "bun:test";
import { logger } from "@k-msg/core";
import { WebhookEventType } from "../types/webhook.types";
import { QueueManager } from "./queue.manager";
import type { DispatchJob } from "./types";

function createJob(scheduledAt: Date): DispatchJob {
  return {
    id: "job_1",
    event: {
      id: "evt_1",
      type: WebhookEventType.MESSAGE_SENT,
      timestamp: new Date(),
      data: { ok: true },
      metadata: {},
      version: "1.0",
    },
    endpoint: {
      id: "endpoint_1",
      url: "https://example.com/webhook",
      active: true,
      events: [WebhookEventType.MESSAGE_SENT],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    },
    priority: 5,
    createdAt: new Date(),
    scheduledAt,
    attempts: 0,
    maxAttempts: 3,
  };
}

// Polls instead of sleeping a fixed time so timer tests stay fast locally and
// stable on a loaded CI runner.
async function waitFor(
  condition: () => boolean,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

describe("QueueManager", () => {
  // The delayed job is enqueued from a timer that nothing awaits. bun test
  // fails the running test on an unhandled rejection, so a pass shows the
  // timer handled the failure.
  test("logs a delayed job that fails to activate", async () => {
    const queue = new QueueManager();
    queue.on("jobEnqueued", () => {
      throw new Error("listener down");
    });
    const loggerError = spyOn(logger, "error").mockImplementation(() => {});

    try {
      expect(await queue.enqueue(createJob(new Date(Date.now() + 10)))).toBe(
        true,
      );
      expect(queue.getStats().delayedJobs).toBe(1);

      await waitFor(() => loggerError.mock.calls.length > 0);

      expect(loggerError).toHaveBeenCalledTimes(1);
      expect(loggerError.mock.calls[0]?.[1]).toMatchObject({ jobId: "job_1" });
      expect(loggerError.mock.calls[0]?.[2]?.message).toBe("listener down");
      // The job reached its queue before the listener threw.
      expect(queue.getStats()).toMatchObject({ delayedJobs: 0, totalJobs: 1 });
    } finally {
      await queue.shutdown();
      loggerError.mockRestore();
    }
  });
});
