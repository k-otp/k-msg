export interface CloudflareObjectStorage {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export interface CloudflareKvNamespaceLike {
  get(key: string, type?: "text"): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

export interface R2ObjectBodyLike {
  text(): Promise<string>;
}

export interface CloudflareR2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    objects: Array<{ key: string }>;
    truncated?: boolean;
    cursor?: string;
  }>;
}

export interface CloudflareDurableObjectStorageLike {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list<T>(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
  }): Promise<Map<string, T>>;
}

export function createKvObjectStorage(
  namespace: CloudflareKvNamespaceLike,
): CloudflareObjectStorage {
  return {
    async get(key: string): Promise<string | null> {
      return namespace.get(key, "text");
    },
    async put(key: string, value: string): Promise<void> {
      await namespace.put(key, value);
    },
    async delete(key: string): Promise<void> {
      await namespace.delete(key);
    },
    async list(prefix: string): Promise<string[]> {
      const keys: string[] = [];
      let cursor: string | undefined;
      let listComplete = false;

      while (!listComplete) {
        const page = await namespace.list({ prefix, cursor, limit: 1000 });
        keys.push(...page.keys.map((key) => key.name));
        listComplete = page.list_complete;
        cursor = page.cursor;
        if (!cursor && !listComplete) break;
      }

      return keys;
    },
  };
}

export function createR2ObjectStorage(
  bucket: CloudflareR2BucketLike,
): CloudflareObjectStorage {
  return {
    async get(key: string): Promise<string | null> {
      const object = await bucket.get(key);
      if (!object) return null;
      return object.text();
    },
    async put(key: string, value: string): Promise<void> {
      await bucket.put(key, value);
    },
    async delete(key: string): Promise<void> {
      await bucket.delete(key);
    },
    async list(prefix: string): Promise<string[]> {
      const keys: string[] = [];
      let cursor: string | undefined;
      let truncated = true;

      while (truncated) {
        const page = await bucket.list({ prefix, cursor, limit: 1000 });
        keys.push(...page.objects.map((object) => object.key));
        truncated = Boolean(page.truncated);
        cursor = page.cursor;
        if (!cursor && truncated) break;
      }

      return keys;
    },
  };
}

export function createDurableObjectStorage(
  storage: CloudflareDurableObjectStorageLike,
): CloudflareObjectStorage {
  return {
    async get(key: string): Promise<string | null> {
      const value = await storage.get<string>(key);
      return typeof value === "string" ? value : null;
    },
    async put(key: string, value: string): Promise<void> {
      await storage.put(key, value);
    },
    async delete(key: string): Promise<void> {
      await storage.delete(key);
    },
    async list(prefix: string): Promise<string[]> {
      const page = await storage.list({ prefix, limit: 1000 });
      return Array.from(page.keys());
    },
  };
}
