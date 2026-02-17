import {
  type MessageRepository,
  ok,
  type Result,
  type SendInput,
} from "@k-msg/core";

export class InMemoryMessageRepository implements MessageRepository {
  private messages: Map<
    string,
    { input: SendInput; result?: Record<string, any> }
  > = new Map();
  private nextId = 1;

  async save(
    input: SendInput,
    _options?: { strategy?: string },
  ): Promise<Result<string, any>> {
    const id = `persist-${this.nextId++}`;
    this.messages.set(id, { input });
    return ok(id);
  }

  async update(
    id: string,
    result: Record<string, any>,
  ): Promise<Result<void, any>> {
    const message = this.messages.get(id);
    if (message) {
      message.result = result;
      return ok(undefined);
    }
    return ok(undefined);
  }

  async find(id: string): Promise<Result<any | null, any>> {
    const message = this.messages.get(id);
    return ok(message ? { id, ...message } : null);
  }

  // Helper for tests to inspect state
  getMessage(id: string) {
    return this.messages.get(id);
  }

  getAllMessages() {
    return Array.from(this.messages.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  clear() {
    this.messages.clear();
    this.nextId = 1;
  }
}
