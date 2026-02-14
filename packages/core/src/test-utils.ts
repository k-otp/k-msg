import { expect } from "bun:test";
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  type Provider,
  type Result,
  type SendOptions,
  type SendResult,
} from "./index";

export class MockProvider implements Provider {
  public readonly id: string;
  public readonly name: string;

  constructor(id: string = "mock", name: string = "Mock Provider") {
    this.id = id;
    this.name = name;
  }

  async send(params: SendOptions): Promise<Result<SendResult, KMsgError>> {
    if (params.to === "01000000000") {
      return fail(
        new KMsgError(KMsgErrorCode.INVALID_REQUEST, "Invalid phone number"),
      );
    }

    return ok({
      messageId: `mock_${Date.now()}`,
      status: "SENT",
      provider: this.id,
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
