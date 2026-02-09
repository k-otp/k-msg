import { type SendOptions, UniversalProvider } from "@k-msg/core";
import { AligoAdapter } from "../adapters/aligo.adapter";
import type { AligoConfig } from "../types/aligo";

export class AligoProvider extends UniversalProvider {
  constructor(config: AligoConfig) {
    const adapter = new AligoAdapter(config);
    super(adapter, {
      id: "aligo",
      name: "Aligo Smart SMS Provider",
      version: "1.0.0",
    });
  }

  // Compatibility with tests that expect direct send
  async send(params: SendOptions | any): Promise<any> {
    return super.send(params);
  }
}

export const createAligoProvider = (config: AligoConfig) =>
  new AligoProvider(config);

export const createDefaultAligoProvider = () => {
  const config: AligoConfig = {
    apiKey: process.env.ALIGO_API_KEY || "",
    userId: process.env.ALIGO_USER_ID || "",
    senderKey: process.env.ALIGO_SENDER_KEY || "",
    sender: process.env.ALIGO_SENDER || "",
    testMode: process.env.NODE_ENV !== "production",
    debug: process.env.NODE_ENV === "development",
  };

  if (!config.apiKey || !config.userId) {
    throw new Error(
      "ALIGO_API_KEY and ALIGO_USER_ID environment variables are required",
    );
  }

  return createAligoProvider(config);
};

export class AligoProviderFactory {
  static create(config: AligoConfig): AligoProvider {
    return new AligoProvider(config);
  }

  static createDefault(): AligoProvider {
    return createDefaultAligoProvider();
  }

  static getInstance() {
    return {
      createProvider: (config: AligoConfig) => new AligoProvider(config),
      initialize: () => {},
    };
  }
}

export function initializeAligo(): void {}
