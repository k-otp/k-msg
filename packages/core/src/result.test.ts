import { describe, expect, test } from "bun:test";
import { fail, ok, Result } from "./result";

describe("Result", () => {
  test("ok should create success result", () => {
    const result = ok(42);
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.value).toBe(42);
  });

  test("fail should create failure result", () => {
    const error = new Error("test error");
    const result = fail(error);
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });

  test("Result should be serializable", () => {
    const succResult = ok({ some: "data" });
    const serialized = JSON.parse(JSON.stringify(succResult));
    expect(serialized.isSuccess).toBe(true);
    expect(serialized.value.some).toBe("data");
  });
});

describe("Result.map", () => {
  test("should transform success value", () => {
    const result = ok(5);
    const mapped = Result.map(result, (v) => v * 2);
    expect(mapped.isSuccess && mapped.value).toBe(10);
  });

  test("should pass through failure", () => {
    const result = fail<Error>(new Error("oops"));
    const mapped = Result.map(result, () => 42);
    expect(mapped.isFailure && mapped.error.message).toBe("oops");
  });
});

describe("Result.flatMap", () => {
  test("should chain success values", () => {
    const result = ok(5);
    const chained = Result.flatMap(result, (v) => ok(v.toString()));
    expect(chained.isSuccess && chained.value).toBe("5");
  });

  test("should propagate inner failure", () => {
    const result = ok(5);
    const chained = Result.flatMap(result, () => fail(new Error("inner fail")));
    expect(chained.isFailure).toBe(true);
  });

  test("should pass through outer failure", () => {
    const result = fail<Error>(new Error("outer"));
    const chained = Result.flatMap(result, () => ok(42));
    expect(chained.isFailure && chained.error.message).toBe("outer");
  });
});

describe("Result.mapError", () => {
  test("should transform error", () => {
    const result = fail<string>("original");
    const mapped = Result.mapError(result, (e) => `wrapped: ${e}`);
    expect(mapped.isFailure && mapped.error).toBe("wrapped: original");
  });

  test("should pass through success", () => {
    const result = ok(42);
    const mapped = Result.mapError(result, () => "new error");
    expect(mapped.isSuccess && mapped.value).toBe(42);
  });
});

describe("Result.unwrap", () => {
  test("should return value from success", () => {
    expect(Result.unwrap(ok(42))).toBe(42);
  });

  test("should throw error from failure", () => {
    expect(() => Result.unwrap(fail(new Error("boom")))).toThrow("boom");
  });
});

describe("Result.unwrapOr", () => {
  test("should return value from success", () => {
    expect(Result.unwrapOr(ok(42), 0)).toBe(42);
  });

  test("should return default from failure", () => {
    expect(Result.unwrapOr(fail(new Error("boom")), 0)).toBe(0);
  });
});

describe("Result.unwrapOrElse", () => {
  test("should return computed default from failure", () => {
    const result = fail<string>("not found");
    expect(Result.unwrapOrElse(result, (e) => `fallback: ${e}`)).toBe(
      "fallback: not found",
    );
  });
});

describe("Result.match", () => {
  test("should call ok handler for success", () => {
    const result = ok(42);
    const output = Result.match(result, {
      ok: (v) => `got ${v}`,
      fail: (e) => `error: ${e}`,
    });
    expect(output).toBe("got 42");
  });

  test("should call fail handler for failure", () => {
    const result = fail("bad");
    const output = Result.match(result, {
      ok: () => "ok",
      fail: (e) => `error: ${e}`,
    });
    expect(output).toBe("error: bad");
  });
});

describe("Result.fromPromise", () => {
  test("should wrap resolved promise as ok", async () => {
    const result = await Result.fromPromise(Promise.resolve(42));
    expect(result.isSuccess).toBe(true);
    expect(result.isSuccess && result.value).toBe(42);
  });

  test("should wrap rejected promise as fail", async () => {
    const result = await Result.fromPromise(
      Promise.reject(new Error("async boom")),
    );
    expect(result.isFailure).toBe(true);
  });
});

describe("Result.isOk / Result.isFail", () => {
  test("isOk returns true for success", () => {
    expect(Result.isOk(ok(1))).toBe(true);
    expect(Result.isOk(fail("e"))).toBe(false);
  });

  test("isFail returns true for failure", () => {
    expect(Result.isFail(fail("e"))).toBe(true);
    expect(Result.isFail(ok(1))).toBe(false);
  });
});


describe("Result.tap", () => {
  test("should call fn with result and return same result (success)", () => {
    const result = ok(42);
    let called = false;
    const tapped = Result.tap(result, (r) => {
      called = true;
      expect(r).toBe(result);
    });
    expect(called).toBe(true);
    expect(tapped).toBe(result);
  });

  test("should call fn with result and return same result (failure)", () => {
    const result = fail(new Error("oops"));
    let called = false;
    const tapped = Result.tap(result, (r) => {
      called = true;
      expect(r).toBe(result);
    });
    expect(called).toBe(true);
    expect(tapped).toBe(result);
  });

  test("should allow chaining", () => {
    const result = ok(5);
    const logs: number[] = [];
    const final = Result.tap(Result.map(result, (v) => v * 2), (r) => {
      if (r.isSuccess) logs.push(r.value);
    });
    expect(final.isSuccess && final.value).toBe(10);
    expect(logs).toEqual([10]);
  });
});

describe("Result.tapOk", () => {
  test("should call fn only on success", () => {
    const result = ok(42);
    let called = false;
    const tapped = Result.tapOk(result, (v) => {
      called = true;
      expect(v).toBe(42);
    });
    expect(called).toBe(true);
    expect(tapped).toBe(result);
  });

  test("should not call fn on failure", () => {
    const result = fail(new Error("oops"));
    let called = false;
    const tapped = Result.tapOk(result, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(tapped).toBe(result);
  });

  test("should allow chaining with tapErr", () => {
    const result = ok("success");
    const logs: string[] = [];
    Result.tapOk(result, (v) => logs.push(`ok: ${v}`));
    expect(logs).toEqual(["ok: success"]);
  });
});

describe("Result.tapErr", () => {
  test("should call fn only on failure", () => {
    const result = fail(new Error("oops"));
    let called = false;
    const tapped = Result.tapErr(result, (e) => {
      called = true;
      expect(e.message).toBe("oops");
    });
    expect(called).toBe(true);
    expect(tapped).toBe(result);
  });

  test("should not call fn on success", () => {
    const result = ok(42);
    let called = false;
    const tapped = Result.tapErr(result, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(tapped).toBe(result);
  });
});

describe("Result.expect", () => {
  test("should return value on success", () => {
    const result = ok(42);
    expect(Result.expect(result, "should not throw")).toBe(42);
  });

  test("should throw with message on failure", () => {
    const originalError = new Error("original");
    const result = fail(originalError);
    expect(() => Result.expect(result, "operation failed")).toThrow(
      "operation failed",
    );
  });

  test("should include original error as cause", () => {
    const originalError = new Error("original");
    const result = fail(originalError);
    try {
      Result.expect(result, "operation failed");
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toBe("operation failed");
      expect((e as Error).cause).toBe(originalError);
    }
  });
});
