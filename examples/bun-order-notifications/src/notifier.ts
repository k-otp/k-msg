import { interpolate } from "@k-msg/template";
import type { KMsg, KMsgError, Result, SendInput, SendResult } from "k-msg";
import type { ShippedOrder } from "./orders";

/**
 * The approved AlimTalk template body. It must match the template registered
 * under ALIMTALK_TEMPLATE_ID character for character.
 */
export const SHIPPED_TEMPLATE =
  "#{customerName}, your order #{orderId} has shipped.\nTracking number: #{trackingNumber}";

/** How long one provider call may take before it fails as NETWORK_TIMEOUT. */
export const PROVIDER_TIMEOUT_MS = 10_000;
// A batch shares one signal, and KMsg sends it in chunks of up to 50.
const BATCH_TIMEOUT_MS = 30_000;

export type SendOutcome = Result<SendResult, KMsgError>;

export interface ShippingNotifierOptions {
  kmsg: KMsg;
  templateId: string;
  /** Registered sender number for the fallback; undefined only with mock. */
  senderNumber: string | undefined;
}

/** Tells customers their order shipped: AlimTalk, with an LMS fallback. */
export class ShippingNotifier {
  private readonly kmsg: KMsg;
  private readonly templateId: string;
  private readonly senderNumber: string | undefined;

  constructor(options: ShippingNotifierOptions) {
    this.kmsg = options.kmsg;
    this.templateId = options.templateId;
    this.senderNumber = options.senderNumber;
  }

  notify(order: ShippedOrder): Promise<SendOutcome> {
    return this.kmsg.send(this.toAlimTalk(order), {
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
  }

  /** Sends every order in one KMsg batch; outcomes keep the input order. */
  async notifyAll(orders: ShippedOrder[]): Promise<SendOutcome[]> {
    const batch = await this.kmsg.send(
      orders.map((order) => this.toAlimTalk(order)),
      { signal: AbortSignal.timeout(BATCH_TIMEOUT_MS) },
    );
    return batch.results;
  }

  private toAlimTalk(order: ShippedOrder): SendInput {
    // IWINV fills template variables by position, so keep them in the order
    // they appear in the template.
    const variables = {
      customerName: order.customerName,
      orderId: order.orderId,
      trackingNumber: order.trackingNumber,
    };
    return {
      type: "ALIMTALK",
      to: order.phone,
      from: this.senderNumber,
      templateId: this.templateId,
      variables,
      // Customers without KakaoTalk get the same text as an LMS.
      failover: {
        enabled: true,
        fallbackChannel: "lms",
        fallbackTitle: "Order shipped",
        fallbackContent: interpolate(SHIPPED_TEMPLATE, variables),
      },
      // Aligo sends the rendered template text rather than the variables;
      // the other providers ignore this option.
      providerOptions: { templateContent: SHIPPED_TEMPLATE },
    };
  }
}
