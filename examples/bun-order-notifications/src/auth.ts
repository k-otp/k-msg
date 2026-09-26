import { createHash, timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

/**
 * Requires `Authorization: Bearer <token>`. Both tokens are hashed first so
 * timingSafeEqual compares equal-length buffers and the length does not leak.
 */
export function requireBearerToken(token: string): MiddlewareHandler {
  const expected = sha256(token);
  return async (c, next) => {
    const presented = /^Bearer\s+(\S+)\s*$/i.exec(
      c.req.header("authorization") ?? "",
    )?.[1];
    if (
      presented === undefined ||
      !timingSafeEqual(sha256(presented), expected)
    ) {
      c.header("WWW-Authenticate", "Bearer");
      return c.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Send Authorization: Bearer <API_TOKEN>.",
          },
        },
        401,
      );
    }
    await next();
  };
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}
