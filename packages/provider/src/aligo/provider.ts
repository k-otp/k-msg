import {
  type SendOptions,
  type StandardRequest,
  UniversalProvider,
} from "@k-msg/core";
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
  async send(params: SendOptions | StandardRequest | any): Promise<any> {
    const adapter = this.getAdapter() as AligoAdapter;

    if (isStandardRequest(params)) {
      return adapter.sendStandard(params);
    }

    if (isLegacySendOptions(params)) {
      return adapter.send(params);
    }

    return adapter.sendStandard(params as StandardRequest);
  }

  async getBalance(): Promise<number> {
    return (this.getAdapter() as AligoAdapter).getBalance();
  }
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStandardRequest(value: unknown): value is StandardRequest {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.templateCode === "string" &&
    typeof value.phoneNumber === "string" &&
    typeof value.variables === "object" &&
    value.variables !== null
  );
}

function isLegacySendOptions(value: unknown): value is SendOptions {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.type === "string" &&
    typeof value.to === "string"
  );
}

export const createAligoProvider = (config: AligoConfig) =>
  new AligoProvider(config);

export const createDefaultAligoProvider = () => {
  const config: AligoConfig = {
    apiKey: process.env.ALIGO_API_KEY || "",
    userId: process.env.ALIGO_USER_ID || "",
    senderKey: process.env.ALIGO_SENDER_KEY || "",
    sender: process.env.ALIGO_SENDER || "",
    friendtalkEndpoint: process.env.ALIGO_FRIENDTALK_ENDPOINT,
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
