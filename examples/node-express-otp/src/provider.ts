import { AligoProvider, IWINVProvider, MockProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";
import type { Provider } from "k-msg";
import type { ProviderConfig } from "./env.ts";

export function createProvider(config: ProviderConfig): Provider {
  switch (config.name) {
    case "mock":
      return new MockProvider();
    case "iwinv":
      return new IWINVProvider({
        apiKey: config.apiKey,
        smsApiKey: config.smsApiKey,
        smsAuthKey: config.smsAuthKey,
      });
    case "solapi":
      return new SolapiProvider({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      });
    case "aligo":
      return new AligoProvider({
        apiKey: config.apiKey,
        userId: config.userId,
        testMode: config.testMode,
      });
  }
}
