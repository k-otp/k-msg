import { describe, expect, test } from "bun:test";
import {
  AligoProvider,
  createKMsgAnalytics,
  createKMsgSender,
  createKMsgTemplates,
  fail,
  IWINVProvider,
  KMsg,
  ok,
} from "./index";

describe("k-msg package exports", () => {
  test("exports Result helpers", () => {
    const success = ok("ok");
    const failure = fail(new Error("failed"));

    expect(success.isSuccess).toBe(true);
    expect(failure.isFailure).toBe(true);
  });

  test("exports provider constructors", () => {
    expect(typeof IWINVProvider).toBe("function");
    expect(typeof AligoProvider).toBe("function");
  });

  test("exports KMsg client class", () => {
    expect(typeof KMsg).toBe("function");
  });

  test("creates deprecated helper modules", () => {
    const sender = createKMsgSender({ iwinvApiKey: "test-api-key" });
    const templates = createKMsgTemplates({ iwinvApiKey: "test-api-key" });
    const analytics = createKMsgAnalytics({ iwinvApiKey: "test-api-key" });

    expect(typeof sender.sendMessage).toBe("function");
    expect(typeof templates.parseVariables).toBe("function");
    expect(typeof analytics.getMessageStats).toBe("function");
  });
});
