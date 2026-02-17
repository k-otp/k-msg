export type RuntimeEnvRecord = Record<string, string | undefined>;

type RuntimeGlobal = typeof globalThis & {
  __ENV__?: RuntimeEnvRecord;
  __K_MSG_ENV__?: RuntimeEnvRecord;
  process?: {
    env?: RuntimeEnvRecord;
  };
};

/**
 * Resolve environment variables in a runtime-neutral order.
 *
 * Priority:
 * 1. globalThis.__K_MSG_ENV__
 * 2. globalThis.__ENV__
 * 3. globalThis.process?.env
 */
export function getRuntimeEnvSource(): RuntimeEnvRecord {
  const runtimeGlobal = globalThis as RuntimeGlobal;
  return (
    runtimeGlobal.__K_MSG_ENV__ ?? runtimeGlobal.__ENV__ ?? runtimeGlobal.process?.env ?? {}
  );
}

export function readRuntimeEnv(key: string): string | undefined {
  const value = getRuntimeEnvSource()[key];
  if (typeof value === "string") {
    return value;
  }
  if (value === undefined) {
    return undefined;
  }
  return String(value);
}
