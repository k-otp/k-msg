import {
  type KMsgError,
  ok,
  type ProviderRequestContext,
  type Result,
} from "@k-msg/core";

/** How long a looked-up template body is reused before it is fetched again. */
export const TEMPLATE_CONTENT_TTL_MS = 10 * 60 * 1000;

type TemplateContentResult = Result<string, KMsgError>;

interface PendingLookup {
  signal?: AbortSignal;
  fetch?: ProviderRequestContext["fetch"];
  promise: Promise<TemplateContentResult>;
}

/**
 * Keeps approved AlimTalk template bodies for one provider instance, so sends
 * that need a template's placeholders look it up once rather than per message.
 *
 * Only successful lookups are kept. Concurrent lookups share one request when
 * they carry the same signal and fetch, as the messages of one batch do; a
 * caller with its own signal gets its own request, so another caller's abort
 * cannot fail it.
 */
export class TemplateContentCache {
  private readonly contents = new Map<
    string,
    { content: string; expiresAt: number }
  >();
  private readonly pending = new Map<string, PendingLookup>();

  constructor(private readonly ttlMs = TEMPLATE_CONTENT_TTL_MS) {}

  get(
    key: string,
    context: ProviderRequestContext | undefined,
    load: () => Promise<TemplateContentResult>,
  ): Promise<TemplateContentResult> {
    const cached = this.contents.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(ok(cached.content));
    }

    const shared = this.pending.get(key);
    if (
      shared &&
      shared.signal === context?.signal &&
      shared.fetch === context?.fetch
    ) {
      return shared.promise;
    }

    // Only the current lookup for a key may settle it: a delete() or a newer
    // lookup replaces the pending entry, and a stale answer must not be kept.
    const settle = (): boolean => {
      if (this.pending.get(key) !== lookup) return false;
      this.pending.delete(key);
      return true;
    };
    const lookup: PendingLookup = {
      signal: context?.signal,
      fetch: context?.fetch,
      promise: load().then(
        (result) => {
          if (settle() && result.isSuccess) {
            this.contents.set(key, {
              content: result.value,
              expiresAt: Date.now() + this.ttlMs,
            });
          }
          return result;
        },
        (error: unknown) => {
          settle();
          throw error;
        },
      ),
    };
    this.pending.set(key, lookup);
    return lookup.promise;
  }

  /** Drops a template, e.g. after it was modified or deleted. */
  delete(key: string): void {
    this.contents.delete(key);
    this.pending.delete(key);
  }
}
