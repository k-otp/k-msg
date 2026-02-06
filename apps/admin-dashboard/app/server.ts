import { showRoutes } from 'hono/dev';
import { createApp } from 'honox/server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import K-Message platform setup
import '../src/index';

const app = createApp();

app.use('*', logger());
app.use('*', cors());

showRoutes(app);

export default app;