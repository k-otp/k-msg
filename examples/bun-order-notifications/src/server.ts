import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { SqliteDeliveryTrackingStore } from "@k-msg/messaging/adapters/bun";
import {
  createDeliveryTrackingHooks,
  DeliveryTrackingService,
} from "@k-msg/messaging/tracking";
import { KMsg } from "k-msg";
import { createApp } from "./app";
import { type Config, loadConfig } from "./env";
import { PROVIDER_TIMEOUT_MS, ShippingNotifier } from "./notifier";
import { maskPhone } from "./phone";
import { createProviders } from "./provider";

let config: Config;
try {
  config = loadConfig(Bun.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const providers = createProviders(config);

mkdirSync(dirname(config.trackingDbPath), { recursive: true });
const tracking = new DeliveryTrackingService({
  providers: providers.all,
  store: new SqliteDeliveryTrackingStore({ dbPath: config.trackingDbPath }),
  // IWINV sends the fallback itself. Providers that only partly can flag
  // the send with a warning; if polling then finds the AlimTalk failed because
  // the customer does not use KakaoTalk (k-msg recognizes SOLAPI's codes),
  // tracking sends the fallback once through kmsg, which routes it to the SMS
  // provider.
  apiFailover: {
    // Stops with the poll (tracking.close()) as well as on its own timeout.
    sender: (input, { signal }) => {
      const timeout = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
      return kmsg.send(input, {
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    },
  },
  onStatusChange: ({ record, previousStatus }) => {
    console.info(
      `[tracking] ${record.messageId} ${record.type} to ${maskPhone(record.to)}: ${previousStatus} -> ${record.status}`,
    );
  },
});
await tracking.init();

const kmsg = new KMsg({
  providers: providers.all,
  routing: {
    byType: {
      ALIMTALK: providers.alimtalk.id,
      SMS: providers.sms.id,
      LMS: providers.sms.id,
    },
  },
  defaults: { kakao: config.kakao },
  hooks: createDeliveryTrackingHooks(tracking),
});

const app = createApp({
  apiToken: config.apiToken,
  notifier: new ShippingNotifier({
    kmsg,
    templateId: config.templateId,
    senderNumber: config.senderNumber,
  }),
  tracking,
});
const server = Bun.serve({ port: config.port, fetch: app.fetch });
tracking.start();
console.info(
  `[server] listening on ${server.url} (AlimTalk: ${providers.alimtalk.id}, SMS: ${providers.sms.id})`,
);

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.info(`[server] ${signal} received, shutting down`);
  tracking.stop();
  // Requests still in flight record their sends in the store, so let them
  // finish before closing it.
  await server.stop();
  await tracking.close();
}
function onSignal(signal: NodeJS.Signals): void {
  shutdown(signal).catch((error: unknown) => {
    console.error("[server] shutdown failed", error);
    process.exitCode = 1;
  });
}
process.once("SIGTERM", onSignal);
process.once("SIGINT", onSignal);
