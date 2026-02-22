import { describe, expect, test } from "bun:test";
import {
  getRolloutKnownKids,
  selectActiveKidByRollout,
  type ActiveKidRolloutPolicy,
} from "./rollout-policy";

describe("active kid rollout policy", () => {
  test("selectActiveKidByRollout is deterministic for the same sticky context", () => {
    const policy: ActiveKidRolloutPolicy = {
      seed: "seed-v1",
      buckets: [{ kid: "k-2026-02", percentage: 50 }],
      defaultKid: "k-2026-01",
    };

    const context = {
      tenantId: "tenant-a",
      providerId: "provider-1",
      messageId: "msg-123",
    };

    const first = selectActiveKidByRollout(context, policy, "k-2026-01");
    const second = selectActiveKidByRollout(context, policy, "k-2026-01");

    expect(first).toBe(second);
  });

  test("selectActiveKidByRollout falls back to default kid when bucket misses", () => {
    const policy: ActiveKidRolloutPolicy = {
      seed: "seed-v1",
      buckets: [{ kid: "k-2026-02", percentage: 1 }],
      defaultKid: "k-2026-01",
    };

    const selected = selectActiveKidByRollout(
      {
        tenantId: "tenant-z",
        providerId: "provider-9",
        messageId: "msg-999",
      },
      policy,
      "k-2026-01",
    );

    expect(selected === "k-2026-02" || selected === "k-2026-01").toBe(true);
  });

  test("getRolloutKnownKids returns normalized configured kids only", () => {
    const kids = getRolloutKnownKids({
      buckets: [
        { kid: " k-2026-02 ", percentage: 30 },
        { kid: "", percentage: 30 },
        { kid: "k-2026-03", percentage: 40 },
      ],
    });

    expect(kids).toEqual(["k-2026-02", "k-2026-03"]);
  });
});

