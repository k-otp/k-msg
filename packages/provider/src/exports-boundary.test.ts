import { describe, expect, test } from "bun:test";

describe("provider export boundaries", () => {
  test("root export is runtime-neutral", async () => {
    const root = await import("./index");

    expect("SolapiProvider" in root).toBe(false);
    expect(typeof root.AligoProvider).toBe("function");
    expect(typeof root.IWINVProvider).toBe("function");
  });

  test("solapi subpath exports solapi symbols", async () => {
    const solapi = await import("./solapi/index");

    expect(typeof solapi.SolapiProvider).toBe("function");
  });

  test("aligo subpath exports aligo symbols", async () => {
    const aligo = await import("./aligo/index");

    expect(typeof aligo.AligoProvider).toBe("function");
  });
});
