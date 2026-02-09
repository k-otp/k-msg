import { describe, expect, test } from "bun:test";
import { interpolate } from "./interpolator";

describe("interpolator", () => {
  test("should replace simple variables", () => {
    const text = "Hello #{name}!";
    const vars = { name: "World" };
    expect(interpolate(text, vars)).toBe("Hello World!");
  });

  test("should replace multiple variables", () => {
    const text = "Hello #{name}, welcome to #{service}!";
    const vars = { name: "Alice", service: "K-msg" };
    expect(interpolate(text, vars)).toBe("Hello Alice, welcome to K-msg!");
  });

  test("should leave unknown variables as-is", () => {
    const text = "Hello #{name}, your code is #{code}.";
    const vars = { name: "Bob" };
    expect(interpolate(text, vars)).toBe("Hello Bob, your code is #{code}.");
  });

  test("should handle null or undefined values by leaving tokens as-is", () => {
    const text = "Value: #{val}";
    expect(interpolate(text, { val: null })).toBe("Value: #{val}");
    expect(interpolate(text, { val: undefined })).toBe("Value: #{val}");
  });

  test("should handle numeric values", () => {
    const text = "Count: #{count}";
    const vars = { count: 42 };
    expect(interpolate(text, vars)).toBe("Count: 42");
  });

  test("should return empty string for empty input", () => {
    expect(interpolate("", {})).toBe("");
  });

  test("should return original text if no variables provided", () => {
    const text = "Hello #{name}";
    expect(interpolate(text, {})).toBe("Hello #{name}");
  });

  test("should handle special characters in keys", () => {
    const text = "Value: #{user.name}";
    const vars = { "user.name": "John" };
    expect(interpolate(text, vars)).toBe("Value: John");
  });
});
