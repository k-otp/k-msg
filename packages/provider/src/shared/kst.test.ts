import { afterEach, describe, expect, test } from "bun:test";
import {
  formatKstDate,
  formatKstDateTime,
  parseKstDateTime,
  toKst,
} from "./kst";

const originalTimeZone = process.env.TZ;

afterEach(() => {
  if (originalTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimeZone;
});

// 00:30:05 on October 1 in Seoul.
const instant = new Date("2026-09-30T15:30:05Z");

describe.each(["UTC", "America/Los_Angeles", "Asia/Seoul"])(
  "with the host in %s",
  (timeZone) => {
    test("formats an instant as Seoul wall-clock time", () => {
      process.env.TZ = timeZone;
      expect(toKst(instant)).toEqual({
        year: 2026,
        month: 10,
        day: 1,
        hour: 0,
        minute: 30,
        second: 5,
      });
      expect(formatKstDate(instant)).toBe("2026-10-01");
      expect(formatKstDateTime(instant)).toBe("2026-10-01 00:30:05");
    });

    test("reads Seoul wall-clock time as the same instant", () => {
      process.env.TZ = timeZone;
      expect(parseKstDateTime(" 2026-10-01 00:30:05 ")?.toISOString()).toBe(
        instant.toISOString(),
      );
    });
  },
);

test("parseKstDateTime rejects other shapes", () => {
  expect(parseKstDateTime("2026-10-01T00:30:05")).toBeUndefined();
  expect(parseKstDateTime("")).toBeUndefined();
  expect(parseKstDateTime(20261001)).toBeUndefined();
});
