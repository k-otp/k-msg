import { describe, expect, test } from "bun:test";
import { KMsg } from "./index";

describe("k-msg package exports", () => {
  test("exports KMsg client class", () => {
    expect(typeof KMsg).toBe("function");
  });

  test("root facade excludes provider/tracking exports and includes selected core exports", async () => {
    const facade = await import("./index");

    expect("IWINVProvider" in facade).toBe(false);
    expect("createDeliveryTrackingHooks" in facade).toBe(false);
    expect("buildSendInputFromJob" in facade).toBe(false);
    expect(typeof facade.KMsgError).toBe("function");
    expect(typeof facade.KMsgErrorCode).toBe("object");
    expect(typeof facade.ErrorUtils).toBe("object");
    expect(Array.isArray(facade.KMSG_MESSAGE_TYPES)).toBe(true);
    expect(Array.isArray(facade.KMSG_DELIVERY_STATUSES)).toBe(true);
    expect(Array.isArray(facade.KMSG_TERMINAL_STATUSES)).toBe(true);
    expect(Array.isArray(facade.KMSG_POLLABLE_STATUSES)).toBe(true);
    expect(typeof facade.isKMsgMessageType).toBe("function");
    expect(typeof facade.isKMsgDeliveryStatus).toBe("function");
    expect(typeof facade.isTerminalDeliveryStatus).toBe("function");
    expect(typeof facade.isPollableDeliveryStatus).toBe("function");
    expect(typeof facade.getPollableStatuses).toBe("function");
    expect(typeof facade.parseErrorRetryPolicyFromJson).toBe("function");
    expect(typeof facade.normalizeErrorRetryPolicy).toBe("function");
    expect(typeof facade.validateErrorRetryPolicy).toBe("function");
    expect(typeof facade.normalizeProviderError).toBe("function");
    expect(typeof facade.ok).toBe("function");
    expect(typeof facade.fail).toBe("function");
  });

  test("core subpath exposes lightweight core-only exports", async () => {
    const coreFacade = await import("./core/index");

    expect(typeof coreFacade.parseErrorRetryPolicyFromJson).toBe("function");
    expect(typeof coreFacade.normalizeProviderError).toBe("function");
    expect("KMsg" in coreFacade).toBe(false);
  });
});
