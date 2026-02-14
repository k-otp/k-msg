import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type Provider,
  type Result,
  type SendOptions,
  type SendResult,
} from "@k-msg/core";
import { interpolate } from "@k-msg/template";
import type { HookContext, KMsgHooks } from "./hooks";

export class KMsg {
  constructor(
    private readonly provider: Provider,
    private readonly hooks: KMsgHooks = {},
  ) {}

  async send(options: SendOptions): Promise<Result<SendResult, KMsgError>> {
    const messageId = options.messageId || crypto.randomUUID();
    const context: HookContext = {
      messageId,
      options,
      timestamp: Date.now(),
    };

    try {
      if (this.hooks.onBeforeSend) {
        await this.hooks.onBeforeSend(context);
      }

      let finalOptions: SendOptions = { ...options, messageId };

      if (
        finalOptions.type === "SMS" ||
        finalOptions.type === "LMS" ||
        finalOptions.type === "MMS"
      ) {
        const potentialVars = (options as unknown as Record<string, unknown>)
          .variables;
        if (
          potentialVars &&
          typeof potentialVars === "object" &&
          finalOptions.text
        ) {
          finalOptions = {
            ...finalOptions,
            text: interpolate(
              finalOptions.text,
              potentialVars as Record<string, string>,
            ),
          };
        }
      }

      const result = await this.provider.send(finalOptions);

      if (result.isSuccess) {
        if (this.hooks.onSuccess) {
          await this.hooks.onSuccess(context, result.value);
        }
      } else {
        if (this.hooks.onError) {
          await this.hooks.onError(context, (result as any).error);
        }
      }

      return result;
    } catch (error) {
      const kMsgError =
        error instanceof KMsgError
          ? error
          : new KMsgError(
              KMsgErrorCode.UNKNOWN_ERROR,
              error instanceof Error ? error.message : String(error),
            );

      if (this.hooks.onError) {
        await this.hooks.onError(context, kMsgError);
      }

      return fail(kMsgError);
    }
  }
}
