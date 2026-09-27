import { afterEach, describe, expect, test } from "bun:test";
import { fail, KMsgError, KMsgErrorCode, ok } from "@k-msg/core";
import { TemplateContentCache } from "./template-content-cache";

const originalDateNow = Date.now;

afterEach(() => {
  Date.now = originalDateNow;
});

function countingLoader(content: string) {
  const loader = {
    calls: 0,
    load: async () => {
      loader.calls += 1;
      return ok(content);
    },
  };
  return loader;
}

describe("TemplateContentCache", () => {
  test("shares a concurrent lookup only between callers with the same context", async () => {
    const cache = new TemplateContentCache();
    const loader = countingLoader("#{code}");
    const batch = { signal: new AbortController().signal };
    const other = { signal: new AbortController().signal };

    const results = await Promise.all([
      cache.get("TPL_1", batch, loader.load),
      cache.get("TPL_1", batch, loader.load),
      cache.get("TPL_1", other, loader.load),
    ]);

    expect(results.every((result) => result.isSuccess)).toBe(true);
    // The batch shares one lookup; the caller with its own signal gets its own.
    expect(loader.calls).toBe(2);
  });

  test("does not keep a failed lookup", async () => {
    const cache = new TemplateContentCache();

    const failed = await cache.get("TPL_1", undefined, async () =>
      fail(new KMsgError(KMsgErrorCode.NETWORK_ERROR, "unreachable")),
    );
    const retried = await cache.get("TPL_1", undefined, async () =>
      ok("#{code}"),
    );

    expect(failed.isFailure).toBe(true);
    expect(retried.isSuccess).toBe(true);
  });

  test("looks the template up again after the TTL or a delete", async () => {
    let now = 1_000;
    Date.now = () => now;
    const cache = new TemplateContentCache(60_000);
    const loader = countingLoader("#{code}");

    await cache.get("TPL_1", undefined, loader.load);
    now += 59_999;
    await cache.get("TPL_1", undefined, loader.load);
    expect(loader.calls).toBe(1);

    now += 1;
    await cache.get("TPL_1", undefined, loader.load);
    expect(loader.calls).toBe(2);

    cache.delete("TPL_1");
    await cache.get("TPL_1", undefined, loader.load);
    expect(loader.calls).toBe(3);
  });

  test("does not keep a lookup that a delete overtook", async () => {
    const cache = new TemplateContentCache();
    let finishStaleLookup: (content: string) => void = () => {};
    const stale = cache.get(
      "TPL_1",
      undefined,
      () =>
        new Promise((resolve) => {
          finishStaleLookup = (content) => resolve(ok(content));
        }),
    );

    // The template changes while the first lookup is still in flight.
    cache.delete("TPL_1");
    finishStaleLookup("#{old}");
    await stale;

    const loader = countingLoader("#{new}");
    const fresh = await cache.get("TPL_1", undefined, loader.load);
    expect(loader.calls).toBe(1);
    expect(fresh.isSuccess && fresh.value).toBe("#{new}");
  });
});
