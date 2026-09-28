import { describe, expect, test } from "bun:test";
import {
  type DeliveryStatus,
  type FieldCryptoError,
  KMsg,
  type KMsgConfig,
  type KMsgDefaultsConfig,
  type KMsgRoutingConfig,
} from "./index";

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

  test("root facade exports the KMsg config types, DeliveryStatus, and estimateSmsBytes", async () => {
    const facade = await import("./index");
    const routing: KMsgRoutingConfig = { byType: { ALIMTALK: "iwinv" } };
    const defaults: KMsgDefaultsConfig = { sms: { autoLmsBytes: 90 } };
    const config: KMsgConfig = { providers: [], routing, defaults };
    const status: DeliveryStatus = "DELIVERED";

    expect(config.defaults).toBe(defaults);
    expect(status).toBe("DELIVERED");
    expect(facade.estimateSmsBytes("안녕 hi")).toBe(7);
  });

  test("core subpath exposes lightweight core-only exports", async () => {
    const coreFacade = await import("./core/index");

    expect(typeof coreFacade.parseErrorRetryPolicyFromJson).toBe("function");
    expect(typeof coreFacade.normalizeProviderError).toBe("function");
    expect("KMsg" in coreFacade).toBe(false);
  });

  test("core subpath exposes the field-crypto helpers", async () => {
    const coreFacade = await import("./core/index");

    expect(typeof coreFacade.createAesGcmFieldCryptoProvider).toBe("function");
    expect(typeof coreFacade.createAwsKmsKeyResolver).toBe("function");
    expect(typeof coreFacade.createDefaultMasker).toBe("function");
    expect(typeof coreFacade.FieldCryptoError).toBe("function");
  });

  test("root keeps deprecated field-crypto aliases that match k-msg/core", async () => {
    const facade = await import("./index");
    const coreFacade = await import("./core/index");

    const aliases: [string, unknown][] = Object.entries(
      await import("./deprecated-crypto"),
    );
    const root: Record<string, unknown> = facade;
    const core: Record<string, unknown> = coreFacade;

    expect(aliases.length).toBe(17);
    for (const [name, value] of aliases) {
      expect(value).toBe(core[name]);
      // A root export with the same name would shadow the alias silently.
      expect(root[name]).toBe(value);
    }

    const error: FieldCryptoError = new facade.FieldCryptoError("config", "x");
    expect(error).toBeInstanceOf(coreFacade.FieldCryptoError);
  });
});
