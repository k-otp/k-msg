import type { KakaoChannelRuntimeProvider } from "../types";
import { AligoChannelAdapter } from "./aligo.adapter";

export class MockChannelAdapter extends AligoChannelAdapter {
  constructor(provider: KakaoChannelRuntimeProvider) {
    super(provider);
  }
}
