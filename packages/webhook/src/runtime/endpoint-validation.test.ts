import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ENDPOINT_VALIDATION_OPTIONS,
  resolveEndpointValidationOptions,
  validateEndpointUrl,
} from "./endpoint-validation";

describe("validateEndpointUrl", () => {
  test("rejects private hosts by default", () => {
    expect(() =>
      validateEndpointUrl(
        "http://127.0.0.1:8787/webhook",
        DEFAULT_ENDPOINT_VALIDATION_OPTIONS,
      ),
    ).toThrow("Private hosts are not allowed");
  });

  test("allows localhost http when private hosts are explicitly allowed", () => {
    expect(() =>
      validateEndpointUrl("http://127.0.0.1:8787/webhook", {
        allowPrivateHosts: true,
        allowHttpForLocalhost: true,
      }),
    ).not.toThrow();
  });

  test("allows private hosts when allowPrivateHosts=true", () => {
    expect(() =>
      validateEndpointUrl("https://192.168.0.10/hooks", {
        allowPrivateHosts: true,
        allowHttpForLocalhost: false,
      }),
    ).not.toThrow();
  });

  test("resolveEndpointValidationOptions applies defaults", () => {
    expect(resolveEndpointValidationOptions(undefined)).toEqual({
      allowPrivateHosts: false,
      allowHttpForLocalhost: true,
    });
  });
});
