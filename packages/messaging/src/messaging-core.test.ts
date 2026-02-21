/**
 * Tests for messaging-core package
 */

import { describe, expect, test } from "bun:test";
import {
  DeliveryTracker,
  JobProcessor,
  MessageJobProcessor,
  MessageRetryHandler,
} from "./adapters/node/index";
import {
  TemplatePersonalizer,
  TemplateVariableUtils,
} from "@k-msg/template";
import {
  type Job,
  type JobQueue,
  JobStatus,
} from "./queue/job-queue.interface";
import {
  type DeliveryReport,
  MessageEventType,
  type MessageRequest,
  MessageStatus,
} from "./types/message.types";

class InMemoryJobQueue<T> implements JobQueue<T> {
  private readonly jobs = new Map<string, Job<T>>();

  private makeId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  async enqueue(
    type: string,
    data: T,
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<Job<T>> {
    const now = Date.now();
    const job: Job<T> = {
      id: this.makeId(),
      type,
      data,
      status: JobStatus.PENDING,
      priority: options.priority ?? 0,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      delay: options.delay ?? 0,
      createdAt: new Date(now),
      processAt: new Date(now + (options.delay ?? 0)),
      metadata: options.metadata ?? {},
    };
    this.jobs.set(job.id, job);
    return { ...job };
  }

  async dequeue(): Promise<Job<T> | undefined> {
    const now = Date.now();
    const candidates = Array.from(this.jobs.values())
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => job.processAt.getTime() <= now)
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.processAt.getTime() !== b.processAt.getTime()) {
          return a.processAt.getTime() - b.processAt.getTime();
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    const job = candidates[0];
    if (!job) return undefined;

    const next: Job<T> = { ...job, status: JobStatus.PROCESSING };
    this.jobs.set(job.id, next);
    return { ...next };
  }

  async complete(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    this.jobs.set(jobId, {
      ...job,
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
    });
  }

  async fail(
    jobId: string,
    error: string | Error,
    shouldRetry = false,
  ): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    const attempts = job.attempts + 1;
    const errorText = error instanceof Error ? error.message : error;
    if (shouldRetry && attempts < job.maxAttempts) {
      this.jobs.set(jobId, {
        ...job,
        attempts,
        status: JobStatus.PENDING,
        error: errorText,
      });
      return;
    }

    this.jobs.set(jobId, {
      ...job,
      attempts,
      status: JobStatus.FAILED,
      failedAt: new Date(),
      error: errorText,
    });
  }

  async peek(): Promise<Job<T> | undefined> {
    const now = Date.now();
    const candidates = Array.from(this.jobs.values())
      .filter((job) => job.status === JobStatus.PENDING)
      .filter((job) => job.processAt.getTime() <= now)
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.processAt.getTime() - b.processAt.getTime();
      });
    const job = candidates[0];
    return job ? { ...job } : undefined;
  }

  async size(): Promise<number> {
    const now = Date.now();
    return Array.from(this.jobs.values()).filter(
      (job) =>
        job.status === JobStatus.PENDING && job.processAt.getTime() <= now,
    ).length;
  }

  async getJob(jobId: string): Promise<Job<T> | undefined> {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  async remove(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async clear(): Promise<void> {
    this.jobs.clear();
  }
}

describe("JobProcessor", () => {
  test("should require explicit jobQueue injection", () => {
    expect(
      () =>
        new JobProcessor({
          concurrency: 2,
          retryDelays: [1000, 2000],
          maxRetries: 2,
          pollInterval: 500,
          enableMetrics: true,
        }),
    ).toThrow("requires an explicit jobQueue");
  });

  test("should create job processor with default options", () => {
    const processor = new JobProcessor(
      {
        concurrency: 2,
        retryDelays: [1000, 2000],
        maxRetries: 2,
        pollInterval: 500,
        enableMetrics: true,
      },
      new InMemoryJobQueue(),
    );

    expect(processor).toBeDefined();
    expect(processor.getMetrics().processed).toBe(0);
  });

  test("should add and process jobs", async () => {
    const processor = new JobProcessor(
      {
        concurrency: 1,
        retryDelays: [100],
        maxRetries: 1,
        pollInterval: 100,
        enableMetrics: true,
      },
      new InMemoryJobQueue(),
    );

    let processedData: any;
    processor.handle("test-job", async (job) => {
      processedData = job.data;
      return "success";
    });

    processor.start();

    const jobId = await processor.add("test-job", { message: "hello" });

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(processedData).toEqual({ message: "hello" });
    expect(processor.getMetrics().processed).toBe(1);

    await processor.stop();
  });

  test("should retry failed jobs", async () => {
    const processor = new JobProcessor(
      {
        concurrency: 1,
        retryDelays: [50, 100],
        maxRetries: 2,
        pollInterval: 50,
        enableMetrics: true,
      },
      new InMemoryJobQueue(),
    );

    let attempts = 0;
    processor.handle("failing-job", async (job) => {
      attempts++;
      if (attempts < 2) {
        throw new Error("Temporary failure");
      }
      return "success";
    });

    processor.start();

    await processor.add("failing-job", { test: true });

    // Wait for retries
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(attempts).toBe(2);
    expect(processor.getMetrics().retried).toBe(1);

    await processor.stop();
  });
});

describe("MessageJobProcessor", () => {
  const mockProvider = {
    id: "test-provider",
    name: "Test Provider",
    send: async () => ({
      isSuccess: true,
      value: {
        messageId: "test-msg-id",
        status: "SENT",
        provider: "test-provider",
      },
    }),
  } as any;

  test("should process message requests", async () => {
    const processor = new MessageJobProcessor(
      mockProvider,
      {
        concurrency: 1,
        pollInterval: 100,
      },
      new InMemoryJobQueue(),
    );

    const messageRequest: MessageRequest = {
      templateId: "test_template",
      recipients: [
        { phoneNumber: "01012345678" },
        { phoneNumber: "01087654321" },
      ],
      variables: { name: "Test User" },
    };

    processor.start();

    const jobId = await processor.queueMessage(messageRequest);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(jobId).toBeDefined();
    expect(processor.getMetrics().processed).toBe(1);

    await processor.stop();
  });

  test("should handle scheduled messages", async () => {
    const processor = new MessageJobProcessor(
      mockProvider,
      {
        concurrency: 1,
        pollInterval: 100,
      },
      new InMemoryJobQueue(),
    );

    const messageRequest: MessageRequest = {
      templateId: "scheduled_template",
      recipients: [{ phoneNumber: "01012345678" }],
      variables: { name: "Test User" },
    };

    const scheduledAt = new Date(Date.now() + 100); // 100ms in future

    processor.start();

    const jobId = await processor.scheduleMessage(messageRequest, scheduledAt);

    // Wait for scheduled processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(jobId).toBeDefined();

    await processor.stop();
  });
});

describe("MessageRetryHandler", () => {
  test("should add messages for retry", async () => {
    const retryHandler = new MessageRetryHandler({
      policy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 100,
        maxDelay: 1000,
        jitter: false,
        retryableStatuses: [MessageStatus.FAILED],
        retryableErrorCodes: ["NETWORK_TIMEOUT"],
      },
      checkInterval: 50,
      maxQueueSize: 100,
      enablePersistence: false,
    });

    const deliveryReport: DeliveryReport = {
      messageId: "msg_001",
      phoneNumber: "01012345678",
      status: MessageStatus.FAILED,
      attempts: [
        {
          attemptNumber: 1,
          attemptedAt: new Date(),
          status: MessageStatus.FAILED,
          error: { code: "NETWORK_TIMEOUT", message: "Request timeout" },
          provider: "test-provider",
        },
      ],
      metadata: { templateId: "test_template" },
    };

    const added = await retryHandler.addForRetry(deliveryReport);
    expect(added).toBe(true);

    const status = retryHandler.getRetryStatus("msg_001");
    expect(status).toBeDefined();
    expect(status?.messageId).toBe("msg_001");
  });

  test("should not retry non-retryable errors", async () => {
    const retryHandler = new MessageRetryHandler({
      policy: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        initialDelay: 100,
        maxDelay: 1000,
        jitter: false,
        retryableStatuses: [MessageStatus.FAILED],
        retryableErrorCodes: ["NETWORK_TIMEOUT"],
      },
      checkInterval: 100,
      maxQueueSize: 100,
      enablePersistence: false,
    });

    const deliveryReport: DeliveryReport = {
      messageId: "msg_002",
      phoneNumber: "01012345678",
      status: MessageStatus.FAILED,
      attempts: [
        {
          attemptNumber: 1,
          attemptedAt: new Date(),
          status: MessageStatus.FAILED,
          error: {
            code: "INVALID_PHONE_NUMBER",
            message: "Invalid phone number",
          },
          provider: "test-provider",
        },
      ],
      metadata: { templateId: "test_template" },
    };

    const added = await retryHandler.addForRetry(deliveryReport);
    expect(added).toBe(false);
  });
});

describe("DeliveryTracker", () => {
  test("should track message delivery", async () => {
    const tracker = new DeliveryTracker({
      trackingInterval: 100,
      maxTrackingDuration: 60000,
      batchSize: 10,
      enableWebhooks: false,
      webhookRetries: 3,
      webhookTimeout: 5000,
      persistence: { enabled: false, retentionDays: 7 },
    });

    await tracker.trackMessage(
      "msg_003",
      "01012345678",
      "test_template",
      "test-provider",
    );

    const report = tracker.getDeliveryReport("msg_003");
    expect(report).toBeDefined();
    expect(report?.messageId).toBe("msg_003");
    expect(report?.status).toBe(MessageStatus.QUEUED);

    // Update status
    const updated = await tracker.updateStatus("msg_003", MessageStatus.SENT);
    expect(updated).toBe(true);

    const updatedReport = tracker.getDeliveryReport("msg_003");
    expect(updatedReport?.status).toBe(MessageStatus.SENT);
  });

  test("should get messages by status", async () => {
    const tracker = new DeliveryTracker({
      trackingInterval: 100,
      maxTrackingDuration: 60000,
      batchSize: 10,
      enableWebhooks: false,
      webhookRetries: 3,
      webhookTimeout: 5000,
      persistence: { enabled: false, retentionDays: 7 },
    });

    await tracker.trackMessage(
      "msg_004",
      "01012345678",
      "test_template",
      "test-provider",
    );
    await tracker.trackMessage(
      "msg_005",
      "01087654321",
      "test_template",
      "test-provider",
    );

    await tracker.updateStatus("msg_004", MessageStatus.SENT);
    await tracker.updateStatus("msg_005", MessageStatus.FAILED);

    const sentMessages = tracker.getMessagesByStatus(MessageStatus.SENT);
    const failedMessages = tracker.getMessagesByStatus(MessageStatus.FAILED);

    expect(sentMessages.length).toBe(1);
    expect(failedMessages.length).toBe(1);
    expect(sentMessages[0].messageId).toBe("msg_004");
    expect(failedMessages[0].messageId).toBe("msg_005");
  });

  test("should generate delivery statistics", async () => {
    const tracker = new DeliveryTracker({
      trackingInterval: 100,
      maxTrackingDuration: 60000,
      batchSize: 10,
      enableWebhooks: false,
      webhookRetries: 3,
      webhookTimeout: 5000,
      persistence: { enabled: false, retentionDays: 7 },
    });

    // Track multiple messages
    for (let i = 0; i < 10; i++) {
      await tracker.trackMessage(
        `msg_${i}`,
        "01012345678",
        "test_template",
        "test-provider",
      );

      if (i < 7) {
        await tracker.updateStatus(`msg_${i}`, MessageStatus.DELIVERED);
      } else {
        await tracker.updateStatus(`msg_${i}`, MessageStatus.FAILED);
      }
    }

    const stats = tracker.getStats();
    expect(stats.totalMessages).toBe(10);
    expect(stats.byStatus[MessageStatus.DELIVERED]).toBe(7);
    expect(stats.byStatus[MessageStatus.FAILED]).toBe(3);
    expect(stats.deliveryRate).toBe(70);
    expect(stats.failureRate).toBe(30);
  });
});

describe("TemplatePersonalizer", () => {
  test("should replace simple variables", () => {
    const replacer = new TemplatePersonalizer();

    const content = "안녕하세요, #{name}님! 인증코드는 #{code}입니다.";
    const variables = { name: "홍길동", code: "123456" };

    const result = replacer.replace(content, variables);

    expect(result.content).toBe(
      "안녕하세요, 홍길동님! 인증코드는 123456입니다.",
    );
    expect(result.variables.length).toBe(2);
    expect(result.missingVariables.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  test("should handle missing variables", () => {
    const replacer = new TemplatePersonalizer({ allowUndefined: false });

    const content = "안녕하세요, #{name}님! 인증코드는 #{code}입니다.";
    const variables = { name: "홍길동" }; // Missing 'code'

    const result = replacer.replace(content, variables);

    expect(result.content).toBe("안녕하세요, 홍길동님! 인증코드는 입니다.");
    expect(result.missingVariables).toContain("code");
    expect(result.errors.length).toBe(1);
  });

  test("should format values", () => {
    const replacer = new TemplatePersonalizer({ enableFormatting: true });

    const content = "#{name|upper}, 금액: #{amount|currency}";
    const variables = { name: "john doe", amount: 50000 };

    const result = replacer.replace(content, variables);

    expect(result.content).toContain("JOHN DOE");
    expect(result.content).toContain("₩50,000");
  });

  test("should replace variables with VariableMap-compatible values", () => {
    const replacer = new TemplatePersonalizer();

    const content = "#{userName}님, #{orderTotal}원";
    const variables = {
      userName: "김철수",
      orderTotal: 25000,
    };

    const result = replacer.replace(content, variables);

    expect(result.content).toBe("김철수님, 25000원");
  });

  test("should extract variables from content", () => {
    const replacer = new TemplatePersonalizer();

    const content = "#{name}님께서 #{product}를 #{quantity}개 주문하셨습니다.";
    const variables = replacer.extractVariables(content);

    expect(variables).toEqual(["name", "product", "quantity"]);
  });

  test("should validate content", () => {
    const replacer = new TemplatePersonalizer();

    const content = "#{name}님, #{code}";
    const validVariables = { name: "홍길동", code: "123456" };
    const invalidVariables = { name: "홍길동" };

    const validResult = replacer.validate(content, validVariables);
    const invalidResult = replacer.validate(content, invalidVariables);

    expect(validResult.isValid).toBe(true);
    expect(validResult.missingVariables.length).toBe(0);

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.missingVariables).toContain("code");
  });
});

describe("TemplateVariableUtils", () => {
  test("should provide utility functions", () => {
    const content = "#{name}님, 인증코드: #{code}";
    const variables = { name: "홍길동", code: "123456" };

    const extractedVars = TemplateVariableUtils.extractVariables(content);
    expect(extractedVars).toEqual(["name", "code"]);

    const replaced = TemplateVariableUtils.replace(content, variables);
    expect(replaced).toBe("홍길동님, 인증코드: 123456");

    const isValid = TemplateVariableUtils.validate(content, variables);
    expect(isValid).toBe(true);
  });

  test("should personalize content for multiple recipients", () => {
    const content = "안녕하세요, #{name}님! 코드: #{code}";
    const recipients = [
      {
        phoneNumber: "01012345678",
        variables: { name: "홍길동", code: "111111" },
      },
      {
        phoneNumber: "01087654321",
        variables: { name: "김철수", code: "222222" },
      },
    ];

    const personalized = TemplateVariableUtils.personalize(content, recipients);

    expect(personalized.length).toBe(2);
    expect(personalized[0].content).toBe("안녕하세요, 홍길동님! 코드: 111111");
    expect(personalized[1].content).toBe("안녕하세요, 김철수님! 코드: 222222");
  });
});

describe("Integration Tests", () => {
  const mockProvider = {
    id: "test-provider",
    name: "Test Provider",
    send: async () => ({
      isSuccess: true,
      value: {
        messageId: "test-msg-id",
        status: "SENT",
        provider: "test-provider",
      },
    }),
  } as any;

  test("should work together in realistic scenario", async () => {
    // Create components
    const processor = new MessageJobProcessor(
      mockProvider,
      {
        concurrency: 1,
        pollInterval: 100,
      },
      new InMemoryJobQueue(),
    );
    const tracker = new DeliveryTracker({
      trackingInterval: 100,
      maxTrackingDuration: 60000,
      batchSize: 10,
      enableWebhooks: false,
      webhookRetries: 3,
      webhookTimeout: 5000,
      persistence: { enabled: false, retentionDays: 7 },
    });

    // Message request with variables
    const messageRequest: MessageRequest = {
      templateId: "welcome_template",
      recipients: [
        { phoneNumber: "01012345678", variables: { name: "홍길동" } },
        { phoneNumber: "01087654321", variables: { name: "김철수" } },
      ],
      variables: { service: "K-Message" },
    };

    // Start processing
    processor.start();
    tracker.start();

    // Queue message
    const jobId = await processor.queueMessage(messageRequest);

    // Track messages
    await tracker.trackMessage(
      "msg_001",
      "01012345678",
      "welcome_template",
      "test-provider",
    );
    await tracker.trackMessage(
      "msg_002",
      "01087654321",
      "welcome_template",
      "test-provider",
    );

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Update delivery status
    await tracker.updateStatus("msg_001", MessageStatus.SENT);
    await tracker.updateStatus("msg_002", MessageStatus.DELIVERED);

    // Check results
    const stats = tracker.getStats();
    expect(stats.totalMessages).toBe(2);
    expect(stats.byStatus[MessageStatus.SENT]).toBe(1);
    expect(stats.byStatus[MessageStatus.DELIVERED]).toBe(1);

    // Personalize content
    const template =
      "안녕하세요, #{name}님! #{service}에 오신 것을 환영합니다.";
    const personalized = TemplateVariableUtils.personalize(template, [
      {
        phoneNumber: "01012345678",
        variables: { name: "홍길동", service: "K-Message" },
      },
      {
        phoneNumber: "01087654321",
        variables: { name: "김철수", service: "K-Message" },
      },
    ]);

    expect(personalized[0].content).toBe(
      "안녕하세요, 홍길동님! K-Message에 오신 것을 환영합니다.",
    );
    expect(personalized[1].content).toBe(
      "안녕하세요, 김철수님! K-Message에 오신 것을 환영합니다.",
    );

    // Cleanup
    await processor.stop();
    tracker.stop();
  });
});
