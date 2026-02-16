import { describe, expect, test } from "bun:test";
import { MockProvider } from "./mock.provider";

describe("MockProvider", () => {
  test("returns warning when ALIMTALK failover is requested", async () => {
    const provider = new MockProvider();

    const result = await provider.send({
      type: "ALIMTALK",
      to: "01012345678",
      templateCode: "TPL_1",
      variables: { code: "1234" },
      failover: { enabled: true, fallbackContent: "fallback" },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.warnings?.[0]?.code).toBe(
        "FAILOVER_UNSUPPORTED_PROVIDER",
      );
    }
  });
});
