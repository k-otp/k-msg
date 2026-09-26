import {
  formatKstDate,
  formatKstDateTime,
  parseKstDateTime,
} from "../shared/kst";

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// IWINV reads and writes these dates as Korea Standard Time.
export function formatSmsHistoryDate(date: Date): string {
  return formatKstDate(date);
}

export function parseIwinvDateTime(value: unknown): Date | undefined {
  return parseKstDateTime(value);
}

export function formatIwinvDate(date: Date): string {
  return formatKstDateTime(date);
}

export function formatSmsReserveDate(date: Date): string {
  return formatKstDateTime(date);
}
