import { describe, expect, test } from "bun:test";
import type {
  BaseProvider,
  StandardRequest,
  StandardResult,
} from "../types/index";
import { RoundRobinRouterProvider } from "./round-robin-router-provider";

function createMockProvider(params: {
  id: string;
  healthy: boolean;
  issues?: string[];
  messageId: string;
}) {
  const calls: StandardRequest[] = [];

  const provider: BaseProvider<StandardRequest, StandardResult> = {
    id: params.id,
    name: `Provider(${params.id})`,
    type: "messaging",
    version: "1.0.0",
    async healthCheck() {
      return { healthy: params.healthy, issues: params.issues || [] };
    },
    async send(request) {
      calls.push(request);
      return {
        messageId: params.messageId,
        status: "SENT",
        provider: params.id,
        timestamp: new Date(),
        phoneNumber: request.phoneNumber,
      };
    },
  };

  return { provider, calls };
}

describe("RoundRobinRouterProvider", () => {
  test("rotates upstream providers in round-robin order", async () => {
    const a = createMockProvider({ id: "a", healthy: true, messageId: "a-1" });
    const b = createMockProvider({ id: "b", healthy: true, messageId: "b-1" });

    const router = new RoundRobinRouterProvider({
      id: "router",
      providers: [a.provider, b.provider],
    });

    const request: StandardRequest = {
      channel: "SMS",
      templateCode: "SMS_DIRECT",
      phoneNumber: "01012345678",
      variables: {},
      text: "hi",
    };

    const r1 = await router.send(request);
    const r2 = await router.send(request);
    const r3 = await router.send(request);

    expect(r1.provider).toBe("a");
    expect(r2.provider).toBe("b");
    expect(r3.provider).toBe("a");
    expect(a.calls.length).toBe(2);
    expect(b.calls.length).toBe(1);
  });

  test("summarizes health across upstream providers", async () => {
    const a = createMockProvider({ id: "a", healthy: true, messageId: "a-1" });
    const b = createMockProvider({
      id: "b",
      healthy: false,
      issues: ["down"],
      messageId: "b-1",
    });

    const router = new RoundRobinRouterProvider({
      id: "router",
      providers: [a.provider, b.provider],
    });

    const health = await router.healthCheck();
    expect(health.healthy).toBe(true);
    expect(Array.isArray(health.issues)).toBe(true);
    expect(health.data).toBeTruthy();
  });
});
