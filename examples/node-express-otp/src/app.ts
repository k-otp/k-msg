import express, { type ErrorRequestHandler, type Response } from "express";
import { ErrorUtils, type KMsgError, KMsgErrorCode } from "k-msg";
import type { OtpService } from "./otp/service.ts";
import type { SendLimit } from "./otp/store.ts";
import { maskPhone, normalizeMobileNumber } from "./phone.ts";

export interface AppOptions {
  /**
   * Express's `trust proxy` setting. Behind a proxy, it makes `req.ip` the
   * client's address instead of the proxy's.
   */
  trustProxy?: number | string;
}

export function createApp(
  otp: OtpService,
  options: AppOptions = {},
): express.Express {
  const app = express();
  app.disable("x-powered-by");
  if (options.trustProxy !== undefined) {
    app.set("trust proxy", options.trustProxy);
  }
  app.use(express.json({ limit: "1kb" }));

  app.post("/otp/request", async (req, res) => {
    const phone = readPhone(req.body);
    if (phone === undefined) {
      sendError(
        res,
        400,
        "INVALID_PHONE",
        "phone must be a Korean mobile number, e.g. 010-1234-5678.",
      );
      return;
    }

    // The answer never depends on whether the number has an account, so this
    // endpoint cannot be used to find out which numbers are registered.
    const result = await otp.request(phone, req.ip ?? "unknown");
    switch (result.status) {
      case "sent":
        console.info(`[otp] code sent to ${maskPhone(phone)}`);
        res.status(202).json({
          expiresInSeconds: result.expiresInSeconds,
          resendAfterSeconds: result.resendAfterSeconds,
        });
        return;
      case "rate_limited":
        res.set("Retry-After", String(result.retryAfterSeconds));
        sendRateLimited(res, result.limit);
        return;
      case "send_failed":
        console.error(
          `[otp] SMS to ${maskPhone(phone)} failed: ${result.error.code} ${result.error.message}`,
        );
        sendProviderFailure(res, result.error);
        return;
    }
  });

  app.post("/otp/verify", async (req, res) => {
    const phone = readPhone(req.body);
    const code = stringField(req.body, "code");
    if (phone === undefined || code === undefined || !/^\d{6}$/.test(code)) {
      sendError(
        res,
        400,
        "INVALID_REQUEST",
        "Send phone (a Korean mobile number) and code (6 digits).",
      );
      return;
    }

    switch (await otp.verify(phone, code)) {
      case "verified":
        res.json({ verified: true });
        return;
      case "invalid_code":
        sendError(
          res,
          400,
          "INVALID_CODE",
          "The code is wrong or has expired.",
        );
        return;
      case "too_many_attempts":
        console.warn(`[otp] too many wrong codes for ${maskPhone(phone)}`);
        sendError(
          res,
          429,
          "TOO_MANY_ATTEMPTS",
          "Too many wrong codes. Request a new code.",
        );
        return;
    }
  });

  app.use((_req, res) => {
    sendError(res, 404, "NOT_FOUND", "Not found.");
  });
  app.use(handleError);
  return app;
}

function sendRateLimited(res: Response, limit: SendLimit): void {
  switch (limit) {
    case "number":
      sendError(
        res,
        429,
        "RATE_LIMITED",
        "Too many codes were requested for this number. Try again later.",
      );
      return;
    case "client":
      sendError(
        res,
        429,
        "RATE_LIMITED",
        "Too many codes were requested from this address. Try again later.",
      );
      return;
    case "service":
      // Every caller gets this until the hour's count drops, so alert on it:
      // it means heavy traffic or someone spreading requests over addresses.
      console.warn("[otp] the service-wide hourly send limit was reached");
      sendError(
        res,
        503,
        "SERVICE_BUSY",
        "Codes cannot be sent right now. Try again later.",
      );
      return;
  }
}

// The provider's own error text stays in the server log; the client only
// learns whether retrying later can help.
function sendProviderFailure(res: Response, error: KMsgError): void {
  if (error.code === KMsgErrorCode.RATE_LIMIT_EXCEEDED) {
    if (error.retryAfterMs !== undefined) {
      res.set(
        "Retry-After",
        String(Math.max(1, Math.ceil(error.retryAfterMs / 1000))),
      );
    }
    sendError(
      res,
      429,
      "RATE_LIMITED",
      "The SMS provider is busy. Try again later.",
    );
  } else if (ErrorUtils.isRetryable(error)) {
    sendError(
      res,
      503,
      "PROVIDER_UNAVAILABLE",
      "The code could not be sent. Try again later.",
    );
  } else {
    sendError(res, 502, "PROVIDER_ERROR", "The code could not be sent.");
  }
}

// express.json() reports unreadable bodies as 4xx errors: 413 for a body over
// the limit, 415 for an unsupported charset or content encoding, and 400 for
// malformed JSON. Anything else here is a bug.
const handleError: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = clientErrorStatus(error);
  if (status === 413) {
    sendError(res, 413, "PAYLOAD_TOO_LARGE", "The request body is too large.");
  } else if (status === 415) {
    sendError(
      res,
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Send the request body as UTF-8 JSON without a content encoding.",
    );
  } else if (status !== undefined) {
    sendError(res, 400, "INVALID_JSON", "The request body must be valid JSON.");
  } else {
    console.error("[http] unhandled error", error);
    sendError(res, 500, "INTERNAL_ERROR", "Internal server error.");
  }
};

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ error: { code, message } });
}

function readPhone(body: unknown): string | undefined {
  const phone = stringField(body, "phone");
  return phone === undefined ? undefined : normalizeMobileNumber(phone);
}

function stringField(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null || !Object.hasOwn(body, key)) {
    return undefined;
  }
  const value: unknown = Reflect.get(body, key);
  return typeof value === "string" ? value : undefined;
}

function clientErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  const { status } = error;
  return typeof status === "number" && status >= 400 && status < 500
    ? status
    : undefined;
}
