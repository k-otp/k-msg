import type { KMsgError } from "../errors";
import type { Result } from "../result";
import type { SendInput, SendResult } from "../types/message";

export type PersistenceStrategy = "none" | "log" | "queue" | "full";

export interface MessageRepository {
  save(
    input: SendInput,
    options?: { strategy?: PersistenceStrategy },
  ): Promise<Result<string, KMsgError>>;

  update(
    messageId: string,
    result: Partial<SendResult>,
  ): Promise<Result<void, KMsgError>>;

  find(messageId: string): Promise<Result<SendResult | null, KMsgError>>;
}
