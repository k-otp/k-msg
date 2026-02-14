import { expect } from "bun:test";
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type MessageType,
  ok,
  type Provider,
  type Result,
  type SendOptions,
  type SendResult,
} from "./index";

export class MockProvider implements Provider {
  public readonly id: string;
  public readonly name: string;
  public readonly supportedTypes: readonly MessageType[];

  constructor(id: string = "mock", name: string = "Mock Provider") {
    this.id = id;
    this.name = name;
    this.supportedTypes = [
      "ALIMTALK",
      "FRIENDTALK",
      "SMS",
      "LMS",
      "MMS",
      "NSA",
      "VOICE",
      "FAX",
      "RCS_SMS",
      "RCS_LMS",
      "RCS_MMS",
      "RCS_TPL",
      "RCS_ITPL",
      "RCS_LTPL",
    ];
  }

  async healthCheck() {
    return { healthy: true, issues: [] };
  }

  async send(params: SendOptions): Promise<Result<SendResult, KMsgError>> {
    if (params.to === "01000000000") {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "Invalid phone number"),
      );
    }

    return ok({
      messageId: params.messageId || `mock_${Date.now()}`,
      providerId: this.id,
      providerMessageId: `mock_${Date.now()}`,
      status: "SENT",
      type: params.type,
      to: params.to,
    });
  }
}

export const TestAssertions = {
  assertKMsgError: (error: any, expectedCode: KMsgErrorCode) => {
    expect(error).toBeInstanceOf(KMsgError);
    expect(error.code).toBe(expectedCode);
  },
  assertSuccess: <T, E>(result: Result<T, E>): T => {
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) return result.value;
    throw new Error("Expected success but got failure");
  },
  assertFailure: <T, E>(result: Result<T, E>): E => {
    expect(result.isFailure).toBe(true);
    if (result.isFailure) return result.error;
    throw new Error("Expected failure but got success");
  },
};
