import { DurableObject } from "cloudflare:workers";
import { IWINVProvider } from "@k-msg/provider";
import { Hono } from "hono";
import { KMsg } from "k-msg";
import { createDurableObjectJobQueue } from "k-msg/adapters/cloudflare";

type SendJobPayload = {
  to: string;
  text: string;
  from?: string;
};

type EnqueueOptions = {
  delayMs?: number;
  priority?: number;
  maxAttempts?: number;
};

type EnqueueResponse = {
  queueId: string;
  jobId: string;
  processAt: string;
};

type DrainResponse = {
  queueId: string;
  drained: number;
};

type Env = {
  KMSG_QUEUE: DurableObjectNamespace<KMsgQueueDO>;
  IWINV_API_KEY: string;
  IWINV_SMS_API_KEY: string;
  IWINV_SMS_AUTH_KEY: string;
  IWINV_SMS_SENDER_NUMBER?: string;
  QUEUE_NAME?: string;
};

type QueueStorageLike = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list<T>(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<Map<string, T>>;
};

const RETRYABLE_ERROR_CODES = new Set([
  "NETWORK_ERROR",
  "NETWORK_TIMEOUT",
  "RATE_LIMIT_EXCEEDED",
  "INTERNAL_ERROR",
]);

function resolveQueueName(env: Env, requested?: string): string {
  const normalized = requested?.trim();
  if (normalized) return normalized;
  const configured = env.QUEUE_NAME?.trim();
  if (configured) return configured;
  return "default";
}

export class KMsgQueueDO extends DurableObject<Env> {
  // Workers type can model delete() as Promise<boolean>; adapter only needs awaitable delete semantics.
  private readonly queue = createDurableObjectJobQueue<SendJobPayload>(
    this.ctx.storage as unknown as QueueStorageLike,
    { keyPrefix: "kmsg/queue" },
  );

  private readonly sender = new KMsg({
    providers: [
      new IWINVProvider({
        apiKey: this.env.IWINV_API_KEY,
        smsApiKey: this.env.IWINV_SMS_API_KEY,
        smsAuthKey: this.env.IWINV_SMS_AUTH_KEY,
        smsSenderNumber: this.env.IWINV_SMS_SENDER_NUMBER,
      }),
    ],
  });

  async enqueueSend(
    payload: SendJobPayload,
    options: EnqueueOptions = {},
  ): Promise<EnqueueResponse> {
    const job = await this.queue.enqueue("send", payload, {
      delay: options.delayMs ?? 0,
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 3,
    });

    await this.scheduleAlarm(job.processAt.getTime());

    return {
      queueId: this.queueId,
      jobId: job.id,
      processAt: job.processAt.toISOString(),
    };
  }

  async getJob(jobId: string) {
    return this.queue.getJob(jobId);
  }

  async size(): Promise<number> {
    return this.queue.size();
  }

  async drain(maxJobs = 20): Promise<DrainResponse> {
    const safeMaxJobs = Number.isFinite(maxJobs)
      ? Math.max(1, Math.floor(maxJobs))
      : 20;

    let drained = 0;

    for (let index = 0; index < safeMaxJobs; index += 1) {
      const job = await this.queue.dequeue();
      if (!job) break;

      const result = await this.sender.send({
        to: job.data.to,
        text: job.data.text,
        from: job.data.from,
      });

      if (result.isSuccess) {
        await this.queue.complete(job.id, result.value);
      } else {
        const errorCode =
          typeof result.error.code === "string" ? result.error.code : "";
        const shouldRetry = RETRYABLE_ERROR_CODES.has(errorCode);

        await this.queue.fail(job.id, result.error.message, shouldRetry);

        if (shouldRetry) {
          await this.scheduleAlarm(Date.now() + 1000);
        }
      }

      drained += 1;
    }

    const remaining = await this.queue.size();
    if (remaining > 0) {
      await this.scheduleAlarm(Date.now() + 100);
    }

    return { queueId: this.queueId, drained };
  }

  async alarm(): Promise<void> {
    await this.drain(50);
  }

  private get queueId(): string {
    return this.ctx.id.toString();
  }

  private async scheduleAlarm(when: number): Promise<void> {
    const existing = await this.ctx.storage.getAlarm();
    if (existing === null || when < existing) {
      await this.ctx.storage.setAlarm(when);
    }
  }
}

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "k-msg queue on durable objects",
    routes: [
      "POST /queue/send",
      "POST /queue/drain",
      "GET /queue/size",
      "GET /queue/jobs/:jobId",
    ],
  }),
);

app.post("/queue/send", async (c) => {
  const body = await c.req.json<{
    queueName?: string;
    to: string;
    text: string;
    from?: string;
    delayMs?: number;
    priority?: number;
    maxAttempts?: number;
  }>();

  const queueName = resolveQueueName(c.env, body.queueName);
  const queueId = c.env.KMSG_QUEUE.idFromName(queueName).toString();
  const queue = c.env.KMSG_QUEUE.getByName(queueName);

  const created = await queue.enqueueSend(
    {
      to: body.to,
      text: body.text,
      from: body.from,
    },
    {
      delayMs: body.delayMs,
      priority: body.priority,
      maxAttempts: body.maxAttempts,
    },
  );

  return c.json({ ok: true, data: { queueName, ...created, queueId } });
});

app.post("/queue/drain", async (c) => {
  const body = await c.req.json<{ queueName?: string; maxJobs?: number }>();
  const queueName = resolveQueueName(c.env, body.queueName);
  const queueId = c.env.KMSG_QUEUE.idFromName(queueName).toString();
  const queue = c.env.KMSG_QUEUE.getByName(queueName);
  const result = await queue.drain(body.maxJobs ?? 20);
  return c.json({ ok: true, data: { queueName, ...result, queueId } });
});

app.get("/queue/size", async (c) => {
  const queueName = resolveQueueName(c.env, c.req.query("queueName"));
  const queueId = c.env.KMSG_QUEUE.idFromName(queueName).toString();
  const queue = c.env.KMSG_QUEUE.getByName(queueName);
  const size = await queue.size();
  return c.json({ ok: true, data: { queueName, queueId, size } });
});

app.get("/queue/jobs/:jobId", async (c) => {
  const queueName = resolveQueueName(c.env, c.req.query("queueName"));
  const queueId = c.env.KMSG_QUEUE.idFromName(queueName).toString();
  const queue = c.env.KMSG_QUEUE.getByName(queueName);
  const job = await queue.getJob(c.req.param("jobId"));

  if (!job) {
    return c.json({ ok: false, message: "Job not found" }, 404);
  }

  return c.json({ ok: true, data: { queueName, queueId, job } });
});

export default {
  fetch: app.fetch,
};
