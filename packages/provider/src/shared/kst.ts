// Korean provider APIs read and write wall-clock time in Korea Standard Time.
// Korea has kept UTC+9 without daylight saving since 1988, so a fixed offset
// converts exactly, whatever timezone the host runs in.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface KstDateTime {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function toKst(date: Date): KstDateTime {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** `YYYY-MM-DD` in KST. */
export function formatKstDate(date: Date): string {
  const kst = toKst(date);
  return `${kst.year}-${pad(kst.month)}-${pad(kst.day)}`;
}

/** `YYYY-MM-DD HH:mm:ss` in KST. */
export function formatKstDateTime(date: Date): string {
  const kst = toKst(date);
  return `${kst.year}-${pad(kst.month)}-${pad(kst.day)} ${pad(kst.hour)}:${pad(kst.minute)}:${pad(kst.second)}`;
}

/** Reads `YYYY-MM-DD HH:mm:ss` as KST. */
export function parseKstDateTime(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
    value.trim(),
  );
  if (!match) return undefined;

  const fields: KstDateTime = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6]),
  };
  const date = new Date(
    Date.UTC(
      fields.year,
      fields.month - 1,
      fields.day,
      fields.hour,
      fields.minute,
      fields.second,
    ) - KST_OFFSET_MS,
  );
  if (Number.isNaN(date.getTime())) return undefined;

  // Date.UTC rolls out-of-range fields over (February 31 becomes March 3,
  // year 50 becomes 1950); reject any value that does not round-trip.
  const roundTrip = toKst(date);
  const keys = Object.keys(fields) as (keyof KstDateTime)[];
  return keys.every((key) => roundTrip[key] === fields[key]) ? date : undefined;
}
