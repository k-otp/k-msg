import { describe, expect, test } from "bun:test";
import {
  buildSendInputFromJob,
  buildSendInputFromJobDetailed,
} from "./send-input.builder";

describe("buildSendInputFromJob", () => {
  test("builds ALIMTALK input and hydrates providerOptions", () => {
    const result = buildSendInputFromJob(
      {
        type: "ALIMTALK",
        to: "01012345678",
        from: "0299999999",
        templateId: "AUTH_001",
        variables: { code: "123456" },
        providerOptions: {
          requestId: "job-req",
          correlationId: "job-corr",
        },
      },
      {
        requestId: "env-req",
        correlationId: "env-corr",
      },
      3,
    );

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;

    const providerOptions = result.value.providerOptions as Record<
      string,
      unknown
    >;
    expect(result.value.type).toBe("ALIMTALK");
    expect(result.value.templateId).toBe("AUTH_001");
    expect(providerOptions.requestId).toBe("job-req");
    expect(providerOptions.correlationId).toBe("job-corr");
    expect(providerOptions.attempt).toBe(3);
  });

  test("safe mode fails deterministically when required fields are missing", () => {
    const result = buildSendInputFromJob(
      {
        type: "ALIMTALK",
        to: "01012345678",
      },
      { requestId: "req-1" },
      1,
    );

    expect(result.isFailure).toBe(true);
    if (!result.isFailure) return;
    expect(result.error.message).toContain("templateId");
  });

  test("unsafe passthrough returns issues instead of failing", () => {
    const detailed = buildSendInputFromJobDetailed(
      {
        type: "SMS",
        to: "01012345678",
      },
      { requestId: "req-1" },
      1,
      { validationMode: "unsafe_passthrough" },
    );

    expect(detailed.mode).toBe("unsafe_passthrough");
    expect(detailed.result.isSuccess).toBe(true);
    expect(detailed.issues.some((issue) => issue.code === "missing_text")).toBe(
      true,
    );
  });

  test("defaults to ALIMTALK when type is omitted", () => {
    const result = buildSendInputFromJob(
      {
        to: "01012345678",
        templateId: "AUTH_001",
      },
      { requestId: "req-1" },
      1,
    );

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.value.type).toBe("ALIMTALK");
  });
});
