import { describe, expect, test } from "bun:test";
import {
  AligoSendProvider,
  AligoProvider as AligoSendProviderAlias,
  createAligoProvider,
} from "./aligo/send";
import { AligoTemplateProvider } from "./aligo/template";
import { IWINVSendProvider } from "./iwinv/send";
import { IWINVTemplateProvider } from "./iwinv/template";

describe("provider subpath exports", () => {
  test("aligo send subpath exports send-focused provider without template CRUD", () => {
    const provider = new AligoSendProvider({
      apiKey: "api-key",
      userId: "user-id",
      sender: "01000000000",
    });
    const alias = new AligoSendProviderAlias({
      apiKey: "api-key",
      userId: "user-id",
      sender: "01000000000",
    });
    const fromFactory = createAligoProvider({
      apiKey: "api-key",
      userId: "user-id",
      sender: "01000000000",
    });

    expect(provider.id).toBe("aligo");
    expect(alias.id).toBe("aligo");
    expect(fromFactory.id).toBe("aligo");
    expect("createTemplate" in provider).toBe(false);
  });

  test("aligo template subpath exports template-focused provider", () => {
    const provider = new AligoTemplateProvider({
      apiKey: "api-key",
      userId: "user-id",
      senderKey: "sender-key",
    });

    expect(provider.id).toBe("aligo");
    expect("createTemplate" in provider).toBe(true);
    expect("send" in provider).toBe(false);
  });

  test("iwinv send/template subpaths split responsibilities", () => {
    const sendProvider = new IWINVSendProvider({ apiKey: "api-key" });
    const templateProvider = new IWINVTemplateProvider({ apiKey: "api-key" });

    expect(sendProvider.id).toBe("iwinv");
    expect(templateProvider.id).toBe("iwinv");
    expect("createTemplate" in sendProvider).toBe(false);
    expect("createTemplate" in templateProvider).toBe(true);
  });
});
