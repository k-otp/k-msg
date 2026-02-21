import type {
  KakaoChannelApiOperation,
  KakaoChannelRuntimeProvider,
} from "../types";

export class SolapiChannelAdapter {
  readonly mode = "none" as const;

  constructor(private readonly provider: KakaoChannelRuntimeProvider) {}

  unsupportedMessage(operation: KakaoChannelApiOperation): string {
    return `Provider '${this.provider.id}' does not expose Kakao channel onboarding API. Operation '${operation}' is unsupported.`;
  }
}
