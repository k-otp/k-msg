/** A code waiting to be verified. Only its HMAC is stored, never the code. */
export interface OtpChallenge {
  codeHash: string;
  expiresAt: number;
  /** Verify attempts made against this code, the current one included. */
  attempts: number;
}

export interface SendLimits {
  /** Minimum time between two codes to the same number. */
  cooldownMs: number;
  /** Codes per number per hour. */
  maxPerHour: number;
  /** Codes one client address may request per hour, across all numbers. */
  maxPerClientPerHour: number;
  /** Codes the whole service sends per hour, a ceiling on SMS spend. */
  maxTotalPerHour: number;
}

/** Which limit refused a send. */
export type SendLimit = "number" | "client" | "service";

export type SendReservation =
  | { allowed: true }
  | { allowed: false; limit: SendLimit; retryAfterMs: number };

/**
 * Where challenges and send counts live. Each method must be atomic, because
 * concurrent requests race on the same number and the same counters. A Redis
 * store would implement each one as a Lua script or a MULTI transaction.
 */
export interface OtpStore {
  /**
   * Counts a send to `phone` requested by `client` if every limit allows it,
   * and counts nothing otherwise.
   */
  reserveSend(
    phone: string,
    client: string,
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
  /** Send times in the last hour, per client address and for the service. */
  private readonly clientSends = new Map<string, number[]>();
  private serviceSends: number[] = [];
  private lastSweep = 0;

  async reserveSend(
    phone: string,
    client: string,
    now: number,
    limits: SendLimits,
  ): Promise<SendReservation> {
    this.sweep(now);
    const entry = this.entries.get(phone) ?? { sentAt: [] };
    const phoneSends = lastHour(entry.sentAt, now);
    const clientSends = lastHour(this.clientSends.get(client) ?? [], now);
    const serviceSends = lastHour(this.serviceSends, now);

    const last = phoneSends.at(-1);
    if (last !== undefined && now - last < limits.cooldownMs) {
      return {
        allowed: false,
        limit: "number",
        retryAfterMs: last + limits.cooldownMs - now,
      };
    }
    const refused =
      overLimit(phoneSends, limits.maxPerHour, "number", now) ??
      overLimit(clientSends, limits.maxPerClientPerHour, "client", now) ??
      overLimit(serviceSends, limits.maxTotalPerHour, "service", now);
    if (refused !== undefined) return refused;

    phoneSends.push(now);
    clientSends.push(now);
    serviceSends.push(now);
    this.entries.set(phone, { ...entry, sentAt: phoneSends });
    this.clientSends.set(client, clientSends);
    this.serviceSends = serviceSends;
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
    this.clientSends.clear();
    this.serviceSends = [];
  }

  // Forget numbers and clients with nothing left to enforce, so memory stays
  // bounded by the traffic of the last hour.
  private sweep(now: number): void {
    if (now - this.lastSweep < SWEEP_INTERVAL_MS) return;
    this.lastSweep = now;
    for (const [phone, entry] of this.entries) {
      const liveChallenge = (entry.challenge?.expiresAt ?? 0) > now;
      const recentSend = entry.sentAt.some((time) => now - time < HOUR_MS);
      if (!liveChallenge && !recentSend) this.entries.delete(phone);
    }
    for (const [client, sentAt] of this.clientSends) {
      if (!sentAt.some((time) => now - time < HOUR_MS)) {
        this.clientSends.delete(client);
      }
    }
  }
}

function lastHour(sentAt: readonly number[], now: number): number[] {
  return sentAt.filter((time) => now - time < HOUR_MS);
}

/** Refuses a send when `sentAt`, oldest first, already holds `max` sends. */
function overLimit(
  sentAt: readonly number[],
  max: number,
  limit: SendLimit,
  now: number,
): SendReservation | undefined {
  if (sentAt.length < max) return undefined;
  // The send that frees a slot is the one `max` places from the end.
  const freesSlot = sentAt[sentAt.length - max] ?? now;
  return { allowed: false, limit, retryAfterMs: freesSlot + HOUR_MS - now };
}
