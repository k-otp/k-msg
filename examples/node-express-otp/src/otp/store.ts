/** A code waiting to be verified. Only its HMAC is stored, never the code. */
export interface OtpChallenge {
  codeHash: string;
  expiresAt: number;
  /** Verify attempts made against this code, the current one included. */
  attempts: number;
}

export interface SendLimits {
  cooldownMs: number;
  maxPerHour: number;
}

export type SendReservation =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Where challenges and send counts live. Each method must be atomic for a
 * phone number, because concurrent requests race on the same number. A Redis
 * store would implement each one as a Lua script or a MULTI transaction.
 */
export interface OtpStore {
  /** Counts a send if the cooldown and the hourly cap allow it. */
  reserveSend(
    phone: string,
    now: number,
    limits: SendLimits,
  ): Promise<SendReservation>;
  /** Stores a challenge, replacing the number's previous one. */
  saveChallenge(phone: string, challenge: OtpChallenge): Promise<void>;
  /**
   * Counts one verify attempt and returns the challenge as updated, or
   * undefined when the number has no unexpired challenge.
   */
  recordAttempt(phone: string, now: number): Promise<OtpChallenge | undefined>;
  /**
   * Deletes the challenge if it still has this hash. Returns false when a
   * concurrent request used or replaced it first.
   */
  consume(phone: string, codeHash: string): Promise<boolean>;
  close(): Promise<void>;
}

const HOUR_MS = 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;

interface Entry {
  challenge?: OtpChallenge;
  sentAt: number[];
}

/**
 * Keeps everything in this process, so it only suits a single instance and
 * forgets pending codes on restart.
 */
export class InMemoryOtpStore implements OtpStore {
  private readonly entries = new Map<string, Entry>();
  private lastSweep = 0;

  async reserveSend(
    phone: string,
    now: number,
    limits: SendLimits,
  ): Promise<SendReservation> {
    this.sweep(now);
    const entry = this.entries.get(phone) ?? { sentAt: [] };
    const sentAt = entry.sentAt.filter((time) => now - time < HOUR_MS);

    const last = sentAt.at(-1);
    if (last !== undefined && now - last < limits.cooldownMs) {
      return { allowed: false, retryAfterMs: last + limits.cooldownMs - now };
    }
    const first = sentAt[0];
    if (first !== undefined && sentAt.length >= limits.maxPerHour) {
      return { allowed: false, retryAfterMs: first + HOUR_MS - now };
    }

    sentAt.push(now);
    this.entries.set(phone, { ...entry, sentAt });
    return { allowed: true };
  }

  async saveChallenge(phone: string, challenge: OtpChallenge): Promise<void> {
    const entry = this.entries.get(phone) ?? { sentAt: [] };
    this.entries.set(phone, { ...entry, challenge: { ...challenge } });
  }

  async recordAttempt(
    phone: string,
    now: number,
  ): Promise<OtpChallenge | undefined> {
    const challenge = this.entries.get(phone)?.challenge;
    if (!challenge || challenge.expiresAt <= now) return undefined;
    challenge.attempts += 1;
    return { ...challenge };
  }

  async consume(phone: string, codeHash: string): Promise<boolean> {
    const entry = this.entries.get(phone);
    if (entry?.challenge?.codeHash !== codeHash) return false;
    entry.challenge = undefined;
    return true;
  }

  async close(): Promise<void> {
    this.entries.clear();
  }

  // Forget numbers with nothing left to enforce, so memory stays bounded by
  // the traffic of the last hour.
  private sweep(now: number): void {
    if (now - this.lastSweep < SWEEP_INTERVAL_MS) return;
    this.lastSweep = now;
    for (const [phone, entry] of this.entries) {
      const liveChallenge = (entry.challenge?.expiresAt ?? 0) > now;
      const recentSend = entry.sentAt.some((time) => now - time < HOUR_MS);
      if (!liveChallenge && !recentSend) this.entries.delete(phone);
    }
  }
}
