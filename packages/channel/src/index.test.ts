import { describe, expect, test } from "bun:test";
import * as runtimeApi from "./index";

describe("@k-msg/channel runtime exports", () => {
  test("keeps runtime services at the root and excludes toolkit helpers", () => {
    expect(runtimeApi.KakaoChannelBindingResolver).toBeDefined();
    expect(runtimeApi.KakaoChannelCapabilityService).toBeDefined();
    expect(runtimeApi.KakaoChannelLifecycleService).toBeDefined();
    expect("KakaoSenderNumberManager" in runtimeApi).toBe(false);
    expect("ChannelService" in runtimeApi).toBe(false);
    expect("NumberVerifier" in runtimeApi).toBe(false);
  });
});
