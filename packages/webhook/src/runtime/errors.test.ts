import { describe, expect, test } from "bun:test";
import { WebhookEndpointConflictError } from "./errors";

type ErrorsModule = typeof import("./errors");

describe("WebhookEndpointConflictError", () => {
  // The build bundles each entry point on its own, so the root and
  // @k-msg/webhook/adapters/cloudflare each carry a copy of this class. A
  // query string makes Bun load such a second copy.
  test("instanceof recognizes an error thrown by another copy of the class", async () => {
    const specifier = "./errors.ts?another-bundle";
    const copy = (await import(specifier)) as ErrorsModule;
    expect(copy.WebhookEndpointConflictError).not.toBe(
      WebhookEndpointConflictError,
    );

    const fromCopy = new copy.WebhookEndpointConflictError(
      "url",
      "https://example.com/hook",
      "first",
    );

    expect(fromCopy instanceof WebhookEndpointConflictError).toBe(true);
    expect(
      new WebhookEndpointConflictError("id", "a", "a") instanceof
        copy.WebhookEndpointConflictError,
    ).toBe(true);
  });

  test("the message leaves out the URL, which may hold a token", () => {
    const url = "https://hooks.example.com/services/T0/B0/token-abc123";
    const error = new WebhookEndpointConflictError("url", url, "first");

    expect(error.message).not.toContain("token-abc123");
    expect(error.message).toContain("first");
    expect(error.value).toBe(url);
  });

  test("instanceof rejects other errors", () => {
    const lookalike = Object.assign(new Error("conflict"), {
      name: "WebhookEndpointConflictError",
      field: "url",
    });

    expect(lookalike instanceof WebhookEndpointConflictError).toBe(false);
    const nothing: unknown = null;
    expect(nothing instanceof WebhookEndpointConflictError).toBe(false);
  });

  test("a subclass keeps ordinary instanceof", () => {
    class NarrowConflict extends WebhookEndpointConflictError {}

    expect(new NarrowConflict("id", "a", "a")).toBeInstanceOf(
      WebhookEndpointConflictError,
    );
    expect(
      new WebhookEndpointConflictError("id", "a", "a") instanceof
        NarrowConflict,
    ).toBe(false);
  });
});
