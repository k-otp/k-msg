import { describe, expect, test } from "bun:test";
import {
  MessageRequestSchema,
  SchedulingOptionsSchema,
  SendingOptionsSchema,
} from "./message.schema";

describe("message.schema", () => {
  test("applies defaults for retryCount and priority", () => {
    const scheduling = SchedulingOptionsSchema.parse({
      scheduledAt: new Date(Date.now() + 60_000),
    });
    const options = SendingOptionsSchema.parse({});

    expect(scheduling.retryCount).toBe(3);
    expect(options.priority).toBe("normal");
  });

  test("rejects invalid request boundaries", () => {
    const invalidTemplate = MessageRequestSchema.safeParse({
      templateId: "",
      recipients: [{ phoneNumber: "01012345678" }],
      variables: {},
    });

    const invalidRecipient = MessageRequestSchema.safeParse({
      templateId: "tpl-1",
      recipients: [{ phoneNumber: "not-phone" }],
      variables: {},
    });

    const invalidScheduledAt = SchedulingOptionsSchema.safeParse({
      scheduledAt: new Date(Date.now() - 60_000),
    });

    expect(invalidTemplate.success).toBe(false);
    expect(invalidRecipient.success).toBe(false);
    expect(invalidScheduledAt.success).toBe(false);
  });
});
