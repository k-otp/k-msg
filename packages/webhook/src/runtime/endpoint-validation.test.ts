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

  // URL parsing canonicalizes these spellings, so the checks must look at the
  // bracketed IPv6 form, embedded IPv4 addresses, and fully qualified names.
  test.each([
    "https://[::1]/webhook",
    "https://[::]/webhook",
    "https://[::ffff:169.254.169.254]/webhook",
    "https://[::127.0.0.1]/webhook",
    "https://[64:ff9b::a9fe:a9fe]/webhook",
    "https://[fd00::1]/webhook",
    "https://[fe80::1]/webhook",
    "https://0.0.0.0/webhook",
    "https://0x7f.1/webhook",
    "https://100.100.100.200/webhook",
    "https://224.0.0.1/webhook",
    "https://localhost./webhook",
  ])("rejects private address %s by default", (url) => {
    expect(() =>
      validateEndpointUrl(url, DEFAULT_ENDPOINT_VALIDATION_OPTIONS),
    ).toThrow("Private hosts are not allowed");
  });

  test("rejects IPv6 hosts with a zone id", () => {
    expect(() =>
      validateEndpointUrl(
        "https://[fe80::1%25eth0]/webhook",
        DEFAULT_ENDPOINT_VALIDATION_OPTIONS,
      ),
    ).toThrow();
  });

  test.each([
    "https://hooks.example.com/webhook",
    "https://8.8.8.8/webhook",
    "https://100.63.255.255/webhook",
    "https://[2606:4700::1111]/webhook",
  ])("allows public address %s", (url) => {
    expect(() =>
      validateEndpointUrl(url, DEFAULT_ENDPOINT_VALIDATION_OPTIONS),
    ).not.toThrow();
  });

  test("treats IPv6 loopback as localhost for http", () => {
    expect(() =>
      validateEndpointUrl("http://[::1]:8787/webhook", {
        allowPrivateHosts: true,
        allowHttpForLocalhost: true,
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
