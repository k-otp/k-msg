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
    expect(
      spec?.checks.some(
        (check) => check.id === "channel_registered_in_console",
      ),
    ).toBe(true);
  });

  test("solapi spec requires plusId when inference is unavailable", () => {
    const spec = getProviderOnboardingSpec("solapi");
    expect(spec).toBeDefined();
    expect(spec?.plusIdPolicy).toBe("required_if_no_inference");
    expect(spec?.plusIdInference).toBe("unsupported");
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
