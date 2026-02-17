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
    expect(typeof facade.KMsgError).toBe("function");
    expect(typeof facade.KMsgErrorCode).toBe("object");
    expect(typeof facade.ok).toBe("function");
    expect(typeof facade.fail).toBe("function");
  });
});
