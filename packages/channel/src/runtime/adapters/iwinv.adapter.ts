import type {
  KakaoChannelApiOperation,
  KakaoChannelRuntimeProvider,
} from "../types";

export class IwinvChannelAdapter {
  readonly mode = "manual" as const;

  constructor(private readonly provider: KakaoChannelRuntimeProvider) {}

  unsupportedMessage(operation: KakaoChannelApiOperation): string {
    return `Provider '${this.provider.id}' uses manual Kakao channel onboarding. Operation '${operation}' is not available via API.`;
  }
}
