import { KMsg } from "k-msg";
import { createApp } from "./app.ts";
import { type Config, loadConfig } from "./env.ts";
import { OtpService } from "./otp/service.ts";
import { InMemoryOtpStore } from "./otp/store.ts";
import { createProvider } from "./provider.ts";

let config: Config;
try {
  config = loadConfig(process.env);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const store = new InMemoryOtpStore();
const otp = new OtpService({
  kmsg: new KMsg({ providers: [createProvider(config.provider)] }),
  store,
  secret: config.otpSecret,
  senderNumber: config.senderNumber,
});

const server = createApp(otp).listen(config.port, (error) => {
  if (error) {
    console.error(`[server] cannot listen on port ${config.port}:`, error);
    process.exit(1);
  }
  console.info(
    `[server] listening on http://localhost:${config.port} (provider: ${config.provider.name})`,
  );
});

// The first signal stops new connections and lets in-flight requests finish,
// each within one provider timeout; connections still open after 15 seconds
// are cut. `once` lets a second Ctrl+C kill the process outright.
function shutdown(signal: NodeJS.Signals): void {
  console.info(`[server] ${signal} received, shutting down`);
  server.close((error) => {
    store.close().then(
      () => process.exit(error ? 1 : 0),
      (closeError: unknown) => {
        console.error("[server] failed to close the OTP store", closeError);
        process.exit(1);
      },
    );
  });
  setTimeout(() => server.closeAllConnections(), 15_000).unref();
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
