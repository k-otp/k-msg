import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { createApp } from "honox/server";

// Import K-Message platform setup
import "../src/index";

const app = createApp();

app.use("*", logger());
app.use("*", cors());

showRoutes(app);

export default app;
