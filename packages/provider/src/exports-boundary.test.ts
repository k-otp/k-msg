import { describe, expect, test } from "bun:test";

describe("provider export boundaries", () => {
  test("root export is runtime-neutral", async () => {
    const root = await import("./index");

    expect(typeof root.SolapiProvider).toBe("function");
    expect(typeof root.AligoProvider).toBe("function");
    expect(typeof root.IWINVProvider).toBe("function");
    expect(typeof root.providerCliMetadata).toBe("object");
    expect(root.providerCliMetadata.solapi.label).toBe("SOLAPI");
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
