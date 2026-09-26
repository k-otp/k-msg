import type { HonoRequest, MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Config, Env } from "./env";

export type AppEnv = {
  Bindings: Env;
  Variables: { config: Config };
};

/** An error answered as `{"error":{"code":...,"message":...}}`. */
export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

/**
 * Every route needs `Authorization: Bearer <API_TOKEN>`. readConfig rejects a
 * missing or short token before this runs, and an empty one never matches.
 */
export const requireApiToken: MiddlewareHandler<AppEnv> = async (c, next) => {
  const expected = c.var.config.apiToken;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(
    c.req.header("Authorization") ?? "",
  );
  if (
    expected === "" ||
    match === null ||
    !(await tokensMatch(match[1], expected))
  ) {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "A valid bearer token is required",
      { "WWW-Authenticate": "Bearer" },
    );
  }
  await next();
};

// Compares SHA-256 digests in constant time, so the time taken reveals
// neither the token nor its length.
async function tokensMatch(
  provided: string,
  expected: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonObject(
  request: HonoRequest,
): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(
      400,
      "INVALID_JSON",
      "The request body must be valid JSON",
    );
  }
  if (!isRecord(body)) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      "The request body must be a JSON object",
    );
  }
  return body;
}
