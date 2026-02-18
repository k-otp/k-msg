import { describe, expect, test } from "bun:test";
import type { SendOptions } from "../../packages/core/src/types";
import { KMsg } from "../../packages/messaging/src/k-msg";
import { MockProvider } from "../../packages/provider/src";
import { TemplateService } from "../../packages/template/src/service";

describe("Template and Messaging Flow Integration", () => {
  const mockProvider = new MockProvider();
  const templateService = new TemplateService(mockProvider);
  const kmsg = new KMsg({ providers: [mockProvider] });

  const templateData = {
    code: "TEST_TPL_001",
    name: "Test Template",
    content: "Hello #{name}, your code is #{code}.",
    category: "AUTHENTICATION" as const,
    variables: ["name", "code"],
  };

  test("full template lifecycle and messaging", async () => {
    const createResult = await templateService.create(templateData);
    expect(createResult.isSuccess).toBe(true);
    if (!createResult.isSuccess) {
      throw new Error("Failed to create template in integration test");
    }
    const createdCode = createResult.value.code;
    expect(createResult.value.status).toBe("APPROVED");

    const listResult = await templateService.list();
    expect(listResult.isSuccess).toBe(true);
    if (listResult.isSuccess) {
      expect(listResult.value.length).toBeGreaterThan(0);
      expect(listResult.value.some((t) => t.code === createdCode)).toBe(true);
    }

    const updateData = { name: "Updated Template Name" };
    const updateResult = await templateService.update(createdCode, updateData);
    expect(updateResult.isSuccess).toBe(true);
    if (updateResult.isSuccess) {
      expect(updateResult.value.name).toBe(updateData.name);
    }

    const sendOptions: SendOptions = {
      type: "ALIMTALK",
      from: "0212345678",
      to: "01012345678",
      templateId: createdCode,
      variables: {
        name: "John Doe",
        code: "123456",
      },
    };
    const sendOptionKeys = Object.keys(
      sendOptions as unknown as Record<string, unknown>,
    );
    expect(sendOptionKeys).toContain("templateId");
    expect(sendOptionKeys).not.toContain("provider");

    const sendResult = await kmsg.send(sendOptions);
    expect(sendResult.isSuccess).toBe(true);
    if (sendResult.isSuccess) {
      expect(sendResult.value.messageId).toBeDefined();
      expect(sendResult.value.status).toBe("SENT");
      expect(sendResult.value.providerId).toBe("mock");
      const sendValue = sendResult.value as unknown as Record<string, unknown>;
      expect(sendValue.provider).toBeUndefined();
    }

    const deleteResult = await templateService.delete(createdCode);
    expect(deleteResult.isSuccess).toBe(true);

    const getResult = await templateService.get(createdCode);
    expect(getResult.isFailure).toBe(true);
  });
});
