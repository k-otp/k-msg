import { describe, expect, test } from "bun:test";
import {
  getPollableStatuses,
  isKMsgDeliveryStatus,
  isKMsgMessageType,
  isKMsgTerminalStatus,
  isPollableDeliveryStatus,
  isTerminalDeliveryStatus,
  KMSG_DELIVERY_STATUSES,
  KMSG_MESSAGE_TYPES,
  KMSG_POLLABLE_STATUSES,
  KMSG_TERMINAL_STATUSES,
} from "./index";

describe("k-msg status/message helpers", () => {
  test("exports canonical message and delivery constants", () => {
    expect(KMSG_MESSAGE_TYPES).toContain("ALIMTALK");
    expect(KMSG_MESSAGE_TYPES).toContain("RCS_LTPL");
    expect(KMSG_DELIVERY_STATUSES).toEqual([
      "PENDING",
      "SENT",
      "DELIVERED",
      "FAILED",
      "CANCELLED",
      "UNKNOWN",
    ]);
  });

  test("guards validate known values", () => {
    expect(isKMsgMessageType("SMS")).toBe(true);
    expect(isKMsgMessageType("WHATSAPP")).toBe(false);
    expect(isKMsgDeliveryStatus("FAILED")).toBe(true);
    expect(isKMsgDeliveryStatus("DONE")).toBe(false);
    expect(isKMsgTerminalStatus("FAILED")).toBe(true);
    expect(isKMsgTerminalStatus("PENDING")).toBe(false);
  });

  test("terminal and pollable helper sets stay consistent", () => {
    expect(KMSG_TERMINAL_STATUSES).toEqual([
      "DELIVERED",
      "FAILED",
      "CANCELLED",
      "UNKNOWN",
    ]);
    expect(KMSG_POLLABLE_STATUSES).toEqual(["PENDING", "SENT"]);
    expect(getPollableStatuses()).toEqual(KMSG_POLLABLE_STATUSES);

    expect(isTerminalDeliveryStatus("DELIVERED")).toBe(true);
    expect(isTerminalDeliveryStatus("PENDING")).toBe(false);
    expect(isPollableDeliveryStatus("PENDING")).toBe(true);
    expect(isPollableDeliveryStatus("FAILED")).toBe(false);
  });
});
