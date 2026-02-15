import { describe, expect, test } from "bun:test";
import type { TemplateButton } from "../types/template.types";
import { ButtonParser } from "./button.parser";

describe("ButtonParser", () => {
  test("serializeButtons should include iOS/Android URLs for AL button", () => {
    const buttons: TemplateButton[] = [
      {
        type: "AL",
        name: "앱 열기",
        linkIos: "https://example.com/ios",
        linkAndroid: "https://example.com/android",
        schemeIos: "myapp://ios",
        schemeAndroid: "myapp://android",
      },
    ];

    const json = ButtonParser.serializeButtons(buttons);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].url_ios).toBe("https://example.com/ios");
    expect(parsed[0].url_android).toBe("https://example.com/android");
  });

  test("serialize+deserialize should preserve AL links", () => {
    const buttons: TemplateButton[] = [
      {
        type: "AL",
        name: "앱 열기",
        linkIos: "https://example.com/ios",
        linkAndroid: "https://example.com/android",
        schemeIos: "myapp://ios",
        schemeAndroid: "myapp://android",
      },
    ];

    const roundTrip = ButtonParser.deserializeButtons(
      ButtonParser.serializeButtons(buttons),
    );

    expect(roundTrip).toHaveLength(1);
    expect(roundTrip[0].type).toBe("AL");
    expect(roundTrip[0].linkIos).toBe("https://example.com/ios");
    expect(roundTrip[0].linkAndroid).toBe("https://example.com/android");
    expect(roundTrip[0].schemeIos).toBe("myapp://ios");
    expect(roundTrip[0].schemeAndroid).toBe("myapp://android");
  });

  test("serialize+deserialize should preserve WL links", () => {
    const buttons: TemplateButton[] = [
      {
        type: "WL",
        name: "웹사이트 방문",
        linkMobile: "https://m.example.com",
        linkPc: "https://www.example.com",
      },
    ];

    const roundTrip = ButtonParser.deserializeButtons(
      ButtonParser.serializeButtons(buttons),
    );

    expect(roundTrip).toHaveLength(1);
    expect(roundTrip[0].type).toBe("WL");
    expect(roundTrip[0].linkMobile).toBe("https://m.example.com");
    expect(roundTrip[0].linkPc).toBe("https://www.example.com");
  });
});
