import { AligoProvider, IWINVProvider, MockProvider } from "@k-msg/provider";
import { SolapiProvider } from "@k-msg/provider/solapi";
import type { Provider } from "k-msg";
import type { Config, ProviderConfig } from "./env";

export interface Providers {
  alimtalk: Provider;
  /** Sends the SMS/LMS fallback; the same instance when it is shared. */
  sms: Provider;
  /** Each provider once, for KMsg and delivery tracking. */
  all: Provider[];
}

export function createProviders(config: Config): Providers {
  const alimtalk = createProvider(config.alimtalkProvider);
  const sms =
    config.smsProvider === config.alimtalkProvider
      ? alimtalk
      : createProvider(config.smsProvider);
  return {
    alimtalk,
    sms,
    all: sms === alimtalk ? [alimtalk] : [alimtalk, sms],
  };
}

function createProvider(config: ProviderConfig): Provider {
  switch (config.name) {
    case "mock":
      return new MockProvider();
    case "iwinv":
      return new IWINVProvider({
        apiKey: config.apiKey,
        smsApiKey: config.sms?.apiKey,
        smsAuthKey: config.sms?.authKey,
        smsCompanyId: config.sms?.companyId,
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
