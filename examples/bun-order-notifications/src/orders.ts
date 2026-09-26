import { normalizeMobileNumber } from "./phone";

export interface ShippedOrder {
  orderId: string;
  /** Digits-only domestic mobile number. */
  phone: string;
  customerName: string;
  trackingNumber: string;
}

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; problems: string[] };

const ORDER_ID = /^[A-Za-z0-9_-]{1,64}$/;
const TRACKING_NUMBER = /^[A-Za-z0-9-]{6,30}$/;

/** Validates one order; `at` prefixes each problem, e.g. "orders[2].". */
export function parseShippedOrder(
  orderIdInput: unknown,
  body: unknown,
  at = "",
): Parsed<ShippedOrder> {
  const orderId = matching(orderIdInput, ORDER_ID);
  const phoneInput = field(body, "phone");
  const phone =
    typeof phoneInput === "string"
      ? normalizeMobileNumber(phoneInput)
      : undefined;
  const customerName = displayName(field(body, "customerName"));
  const trackingNumber = matching(
    field(body, "trackingNumber"),
    TRACKING_NUMBER,
  );

  if (orderId && phone && customerName && trackingNumber) {
    return {
      ok: true,
      value: { orderId, phone, customerName, trackingNumber },
    };
  }
  const problems: string[] = [];
  if (!orderId) {
    problems.push(`${at}orderId must be 1-64 letters, digits, "-" or "_"`);
  }
  if (!phone) problems.push(`${at}phone must be a Korean mobile number`);
  if (!customerName) {
    problems.push(`${at}customerName must be 1-50 characters`);
  }
  if (!trackingNumber) {
    problems.push(`${at}trackingNumber must be 6-30 letters, digits or "-"`);
  }
  return { ok: false, problems };
}

/** Validates `{"orders":[...]}` with 1 to `maxOrders` distinct orders. */
export function parseShippedBatch(
  body: unknown,
  maxOrders: number,
): Parsed<ShippedOrder[]> {
  const items = field(body, "orders");
  if (!Array.isArray(items) || items.length === 0 || items.length > maxOrders) {
    return {
      ok: false,
      problems: [`orders must be an array of 1 to ${maxOrders} orders`],
    };
  }

  const orders: ShippedOrder[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  items.forEach((item: unknown, index) => {
    const at = `orders[${index}].`;
    const parsed = parseShippedOrder(field(item, "orderId"), item, at);
    if (!parsed.ok) {
      problems.push(...parsed.problems);
    } else if (seen.has(parsed.value.orderId)) {
      // A repeated order would text the same customer twice.
      problems.push(`${at}orderId repeats an earlier order`);
    } else {
      seen.add(parsed.value.orderId);
      orders.push(parsed.value);
    }
  });
  return problems.length > 0
    ? { ok: false, problems }
    : { ok: true, value: orders };
}

function field(source: unknown, key: string): unknown {
  return typeof source === "object" &&
    source !== null &&
    Object.hasOwn(source, key)
    ? Reflect.get(source, key)
    : undefined;
}

function matching(value: unknown, pattern: RegExp): string | undefined {
  return typeof value === "string" && pattern.test(value) ? value : undefined;
}

function displayName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = value.trim();
  // Control characters, newlines included, would break the message layout.
  return name.length > 0 && name.length <= 50 && !/\p{Cc}/u.test(name)
    ? name
    : undefined;
}
