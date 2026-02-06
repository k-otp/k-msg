import { SendOptions, SendResult, KMsgError } from '@k-msg/core';

export interface HookContext {
  messageId: string;
  options: SendOptions;
  timestamp: number;
}

export interface KMsgHooks {
  onBeforeSend?: (context: HookContext) => void | Promise<void>;
  onSuccess?: (context: HookContext, result: SendResult) => void | Promise<void>;
  onError?: (context: HookContext, error: KMsgError) => void | Promise<void>;
}
