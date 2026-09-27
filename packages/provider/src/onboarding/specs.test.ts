import { describe, expect, test } from "bun:test";
import { AligoProvider } from "../aligo/provider";
import { IWINVProvider } from "../iwinv/provider";
import { MockProvider } from "../providers/mock/mock.provider";
import { SolapiProvider } from "../solapi/provider";
import {
  getProviderOnboardingSpec,
  listProviderOnboardingSpecs,
  providerOnboardingSpecs,
} from "./specs";

describe("Provider onboarding specs", () => {
  test("built-in specs are registered", () => {
    const ids = listProviderOnboardingSpecs().map((spec) => spec.providerId);
    expect(ids).toContain("iwinv");
    expect(ids).toContain("aligo");
    expect(ids).toContain("solapi");
    expect(ids).toContain("mock");
  });

  test("iwinv spec includes manual channel prerequisite and optional plusId", () => {
    const spec = getProviderOnboardingSpec("iwinv");
    expect(spec).toBeDefined();
    expect(spec?.channelOnboarding).toBe("manual");
    expect(spec?.plusIdPolicy).toBe("optional");
    const configCheck = spec?.checks.find(
      (check) => check.id === "iwinv_config_required",
    );
    expect(configCheck?.kind).toBe("config");
    if (configCheck?.kind === "config") {
      expect(configCheck.configKeys).toEqual(["apiKey"]);
    }
    // SMS-only configs have no AlimTalk apiKey, so only the AlimTalk
    // preflight requires it.
    expect(configCheck?.scopes).toEqual(["preflight"]);
    // The Kakao channel and template checks apply only to a provider that
    // can send AlimTalk, so doctor skips them for SMS-only configs.
    for (const id of [
      "channel_registered_in_console",
      "template_capability_available",
      "template_list_probe",
    ]) {
      expect(
        spec?.checks.find((check) => check.id === id)?.messageTypes,
      ).toEqual(["ALIMTALK"]);
    }
    expect(
      spec?.checks.some(
        (check) => check.id === "channel_registered_in_console",
      ),
    ).toBe(true);
  });

  test("solapi spec does not require a plusId, which SOLAPI never sends", () => {
    const spec = getProviderOnboardingSpec("solapi");
    expect(spec).toBeDefined();
    // SOLAPI identifies the Kakao channel by pfId (kakao.profileId or
    // config.kakaoPfId); requiring a plusId made KMsg reject every
    // SOLAPI AlimTalk send that did not carry one.
    expect(spec?.plusIdPolicy).toBe("optional");
    expect(spec?.plusIdInference).toBe("unsupported");
  });

  test("aligo spec states that delivery status lookup is not implemented", () => {
    const aligo = new AligoProvider({ apiKey: "api-key", userId: "user" });
    const notes = getProviderOnboardingSpec("aligo")?.notes ?? [];

    // Without it, DeliveryTrackingService keeps Aligo messages at SENT until
    // they time out as UNKNOWN; the spec records that for its readers.
    expect("getDeliveryStatus" in aligo).toBe(false);
    expect(notes.some((note) => note.includes("getDeliveryStatus"))).toBe(true);
  });

  test("provider instances expose getOnboardingSpec()", () => {
    const iwinv = new IWINVProvider({
      apiKey: "api-key",
    });
    const aligo = new AligoProvider({
      apiKey: "api-key",
      userId: "user",
    });
    const solapi = new SolapiProvider({
      apiKey: "api-key",
      apiSecret: "api-secret",
    });
    const mock = new MockProvider();

    expect(iwinv.getOnboardingSpec()).toEqual(providerOnboardingSpecs.iwinv);
    expect(aligo.getOnboardingSpec()).toEqual(providerOnboardingSpecs.aligo);
    expect(solapi.getOnboardingSpec()).toEqual(providerOnboardingSpecs.solapi);
    expect(mock.getOnboardingSpec()).toEqual(providerOnboardingSpecs.mock);
  });
});
