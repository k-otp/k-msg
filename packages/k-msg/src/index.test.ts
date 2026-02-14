import { describe, expect, test } from "bun:test";
import {
  AligoProvider,
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
});
