import { describe, expect, test } from "bun:test";
import {
  AlimTalkTemplateSchema,
  TemplateButtonSchema,
  TemplateCategory,
  TemplateStatus,
} from "./template.types";

describe("template.types schema", () => {
  test("rejects invalid button url", () => {
    const result = TemplateButtonSchema.safeParse({
      type: "WL",
      name: "go",
      linkMobile: "not-url",
    });

    expect(result.success).toBe(false);
  });

  test("rejects negative usage counters", () => {
    const result = AlimTalkTemplateSchema.safeParse({
      id: "tpl-1",
      code: "code-1",
      name: "name",
      content: "content",
      variables: [],
      category: TemplateCategory.NOTIFICATION,
      status: TemplateStatus.APPROVED,
      provider: "provider",
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usage: {
          sent: -1,
          delivered: 0,
          failed: 0,
        },
      },
    });

    expect(result.success).toBe(false);
  });
});
