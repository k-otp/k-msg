import { AligoProvider, IWINVProvider, MockProvider } from "@k-msg/provider";
import { createDefaultMasker, type Provider } from "k-msg";
import type { ProviderConfig } from "./env";

/**
 * Creates the provider KMSG_PROVIDER selects. The sender number is not set
 * here: every send passes the configured KMSG_SENDER_NUMBER as `from`.
 */
export async function createProvider(
  config: ProviderConfig,
): Promise<Provider> {
  switch (config.name) {
    case "mock":
      return new MockProvider();
    case "iwinv":
      return new IWINVProvider({
        apiKey: config.apiKey,
        smsApiKey: config.smsApiKey,
        smsAuthKey: config.smsAuthKey,
      });
    case "solapi": {
      // The SOLAPI SDK is large, so it is evaluated only when selected.
      const { SolapiProvider } = await import("@k-msg/provider/solapi");
      return new SolapiProvider({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      });
    }
    case "aligo":
      return new AligoProvider({
        apiKey: config.apiKey,
        userId: config.userId,
        testMode: config.testMode,
      });
  }
}

/** 01012345678 becomes 010****5678, so logs never hold a whole number. */
export const maskPhoneNumber = createDefaultMasker(3, 4);
