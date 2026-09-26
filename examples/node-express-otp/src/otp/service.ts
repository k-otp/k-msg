import { Buffer } from "node:buffer";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { KMsg, KMsgError } from "k-msg";
import type { OtpStore, SendLimit, SendLimits } from "./store.ts";

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const COOLDOWN_MS = 60 * 1000;
const MAX_PER_NUMBER_PER_HOUR = 5;
// Generous, because carrier NAT puts many phones behind one address.
const MAX_PER_CLIENT_PER_HOUR = 20;
const PROVIDER_TIMEOUT_MS = 10_000;

export type RequestResult =
  | { status: "sent"; expiresInSeconds: number; resendAfterSeconds: number }
  | { status: "rate_limited"; limit: SendLimit; retryAfterSeconds: number }
  | { status: "send_failed"; error: KMsgError };

export type VerifyResult = "verified" | "invalid_code" | "too_many_attempts";

export interface OtpServiceOptions {
  kmsg: KMsg;
  store: OtpStore;
  /** HMAC key, at least 32 bytes. */
  secret: string;
  /** Registered sender number; undefined only with the mock provider. */
  senderNumber: string | undefined;
  /** Codes the whole service sends per hour, a ceiling on SMS spend. */
  maxSendsPerHour: number;
}

/** Issues and checks one-time codes for normalized mobile numbers. */
export class OtpService {
  private readonly kmsg: KMsg;
  private readonly store: OtpStore;
  private readonly secret: string;
  private readonly senderNumber: string | undefined;
  private readonly limits: SendLimits;

  constructor(options: OtpServiceOptions) {
    this.kmsg = options.kmsg;
    this.store = options.store;
    this.secret = options.secret;
    this.senderNumber = options.senderNumber;
    this.limits = {
      cooldownMs: COOLDOWN_MS,
      maxPerHour: MAX_PER_NUMBER_PER_HOUR,
      maxPerClientPerHour: MAX_PER_CLIENT_PER_HOUR,
      maxTotalPerHour: options.maxSendsPerHour,
    };
  }

  /**
   * Texts a new code to `phone`. `client` identifies the caller, such as its
   * IP address, so one caller cannot spread requests over many numbers.
   */
  async request(phone: string, client: string): Promise<RequestResult> {
    const now = Date.now();
    // Counted before sending, and kept even if the send fails, so a client
    // cannot hammer a failing provider.
    const reservation = await this.store.reserveSend(
      phone,
      client,
      now,
      this.limits,
    );
    if (!reservation.allowed) {
      return {
        status: "rate_limited",
        limit: reservation.limit,
        retryAfterSeconds: Math.ceil(reservation.retryAfterMs / 1000),
      };
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.store.saveChallenge(phone, {
      codeHash: this.hash(phone, code),
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
    });

    const result = await this.kmsg.send(
      {
        type: "SMS",
        to: phone,
        from: this.senderNumber,
        text: `[k-msg] Your verification code is ${code}. It expires in ${CODE_TTL_MS / 60_000} minutes.`,
      },
      { signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) },
    );
    if (result.isFailure) return { status: "send_failed", error: result.error };

    return {
      status: "sent",
      expiresInSeconds: CODE_TTL_MS / 1000,
      resendAfterSeconds: COOLDOWN_MS / 1000,
    };
  }

  async verify(phone: string, code: string): Promise<VerifyResult> {
    // The attempt is counted before the comparison, so concurrent guesses
    // cannot exceed the limit.
    const challenge = await this.store.recordAttempt(phone, Date.now());
    if (!challenge) return "invalid_code";
    if (challenge.attempts > MAX_VERIFY_ATTEMPTS) return "too_many_attempts";

    if (!sameDigest(this.hash(phone, code), challenge.codeHash)) {
      return challenge.attempts === MAX_VERIFY_ATTEMPTS
        ? "too_many_attempts"
        : "invalid_code";
    }
    return (await this.store.consume(phone, challenge.codeHash))
      ? "verified"
      : "invalid_code";
  }

  private hash(phone: string, code: string): string {
    return createHmac("sha256", this.secret)
      .update(`${phone}:${code}`)
      .digest("hex");
  }
}

function sameDigest(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
