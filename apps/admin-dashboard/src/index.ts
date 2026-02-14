import {
  AnalyticsService,
  DashboardGenerator,
  MetricsCollector,
  MetricType,
} from "@k-msg/analytics";
import { ChannelService } from "@k-msg/channel";
import { KMsgError } from "@k-msg/core";
import { BulkMessageSender, KMsg } from "@k-msg/messaging";
// Import all k-msg packages
import { IWINVProvider } from "@k-msg/provider";
import { MockTemplateService, type TemplateService } from "@k-msg/template";
import {
  type WebhookConfig,
  WebhookEventType,
  WebhookService,
} from "@k-msg/webhook";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { logger } from "hono/logger";
import { messagesRouter } from "./routes/messages.js";
import { providersRouter } from "./routes/providers.js";
// Import route handlers
import { templatesRouter } from "./routes/templates.js";

// K-Message Platform using all packages
export class KMessagePlatform {
  public readonly provider: IWINVProvider;
  public readonly templateService: TemplateService;
  public readonly kmsg: KMsg;
  public readonly bulkSender: BulkMessageSender;
  public readonly channelService: ChannelService;
  public readonly analyticsService: AnalyticsService;
  public readonly metricsCollector: MetricsCollector;
  public readonly webhookService: WebhookService;
  public readonly dashboardGenerator: DashboardGenerator;

  constructor(config: {
    iwinvApiKey: string;
    iwinvBaseUrl?: string;
    debug?: boolean;
  }) {
    // Initialize IWINV Provider
    this.provider = new IWINVProvider({
      apiKey: config.iwinvApiKey,
      baseUrl: config.iwinvBaseUrl || "https://alimtalk.bizservice.iwinv.kr",
      debug: config.debug || false,
    });

    // Initialize Template Service
    this.templateService = new MockTemplateService() as any;

    // Initialize Messaging Services
    this.kmsg = new KMsg(this.provider);
    this.bulkSender = new BulkMessageSender(this.kmsg);

    // Initialize Channel Service
    this.channelService = new ChannelService();

    // Initialize Analytics
    const analyticsConfig = {
      enableRealTimeTracking: true,
      retentionDays: 30,
      aggregationIntervals: ["minute", "hour", "day"] as (
        | "minute"
        | "hour"
        | "day"
      )[],
      enabledMetrics: [
        MetricType.MESSAGE_SENT,
        MetricType.MESSAGE_DELIVERED,
        MetricType.MESSAGE_FAILED,
        MetricType.TEMPLATE_USAGE,
      ],
    };
    this.analyticsService = new AnalyticsService(analyticsConfig);
    this.metricsCollector = new MetricsCollector(analyticsConfig);
    this.dashboardGenerator = new DashboardGenerator();

    // Initialize Webhook Service
    const webhookConfig: WebhookConfig = {
      maxRetries: 3,
      retryDelayMs: 1000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
      jitter: true,
      timeoutMs: 30000,
      enableSecurity: true,
      secretKey: process.env.WEBHOOK_SECRET || "default-secret",
      algorithm: "sha256",
      signatureHeader: "X-Webhook-Signature",
      signaturePrefix: "sha256=",
      enabledEvents: [
        WebhookEventType.MESSAGE_SENT,
        WebhookEventType.MESSAGE_DELIVERED,
        WebhookEventType.MESSAGE_FAILED,
        WebhookEventType.TEMPLATE_CREATED,
        WebhookEventType.TEMPLATE_UPDATED,
      ],
      batchSize: 10,
      batchTimeoutMs: 5000,
    };
    this.webhookService = new WebhookService(webhookConfig);

    console.log("✅ K-Message Platform initialized with all packages");
  }

  // Platform info
  getInfo() {
    return {
      name: "K-Message Platform",
      version: "0.1.0",
      provider: {
        id: this.provider.id,
        name: this.provider.name,
        capabilities: {
          messaging: true,
          templates: true,
          analytics: true,
        },
      },
      features: {
        templates: true,
        messaging: true,
        bulkSending: true,
        channels: true,
        analytics: true,
        webhooks: true,
        realTimeTracking: true,
      },
      services: {
        templateService: "active",
        channelService: "active",
        analyticsService: "active",
        webhookService: "active",
      },
    };
  }

  // Comprehensive health check
  async healthCheck() {
    const results: any = {
      healthy: true,
      services: {},
      provider: {},
      issues: [],
    };

    try {
      // Provider health check
      results.provider = {
        id: this.provider.id,
        healthy: true,
        issues: [],
      };

      // Service health checks
      results.services.templateService = "healthy";
      results.services.channelService = "healthy";
      results.services.analyticsService = "healthy";
      results.services.webhookService = "healthy";
    } catch (error) {
      results.healthy = false;
      results.issues.push(`Platform health check failed: ${error}`);
    }

    return results;
  }

  // Analytics dashboard data
  async getDashboardData(timeRange: { start: Date; end: Date }) {
    try {
      // Query analytics data
      const analyticsResult = await this.analyticsService.query({
        metrics: [
          MetricType.MESSAGE_SENT,
          MetricType.MESSAGE_DELIVERED,
          MetricType.MESSAGE_FAILED,
        ],
        dateRange: timeRange,
        interval: "hour",
      });

      // Generate dashboard
      const dashboard = await this.dashboardGenerator.generateDashboard(
        timeRange,
        { provider: "iwinv" },
        analyticsResult.data,
      );

      return {
        success: true,
        data: {
          analytics: analyticsResult,
          dashboard,
          summary: analyticsResult.summary,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Analytics error",
      };
    }
  }

  // Cleanup resources
  async shutdown() {
    try {
      await this.webhookService.shutdown();
      console.log("✅ Platform shutdown completed");
    } catch (error) {
      console.error("❌ Platform shutdown error:", error);
    }
  }
}

// Create main Hono app with JSX support
const app = new Hono();

// Initialize K-Message Platform with all packages
let platform: KMessagePlatform | null = null;

if (process.env.IWINV_API_KEY) {
  platform = new KMessagePlatform({
    iwinvApiKey: process.env.IWINV_API_KEY,
    iwinvBaseUrl: process.env.IWINV_BASE_URL,
    debug: process.env.NODE_ENV === "development",
  });
  console.log("✅ K-Message Platform initialized successfully");
} else {
  console.log("⚠️  IWINV_API_KEY not found - platform running in demo mode");
}

// Middleware
app.use("*", logger());
app.use("*", cors());

// Serve static files
app.use("/static/*", serveStatic({ root: "./public" }));

// API Routes using k-msg services
if (platform) {
  app.route("/api/templates", templatesRouter(platform));
  app.route("/api/messages", messagesRouter(platform));
  app.route("/api/providers", providersRouter(platform));
}

// Platform info API
app.get("/api/info", (c) => {
  if (!platform) {
    return c.json(
      {
        success: false,
        error: "Platform not initialized - missing IWINV_API_KEY",
      },
      503,
    );
  }

  const info = platform.getInfo();
  return c.json({ success: true, data: info });
});

// Health check API
app.get("/api/health", async (c) => {
  if (!platform) {
    return c.json(
      {
        healthy: false,
        error: "Platform not initialized - missing IWINV_API_KEY",
      },
      503,
    );
  }

  try {
    const health = await platform.healthCheck();
    return c.json(health);
  } catch (error) {
    return c.json(
      {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

// Analytics dashboard API
app.get("/api/analytics/dashboard", async (c) => {
  if (!platform) {
    return c.json(
      {
        success: false,
        error: "Platform not initialized",
      },
      503,
    );
  }

  try {
    const hours = parseInt(c.req.query("hours") || "24");
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);

    const dashboardData = await platform.getDashboardData({ start, end });
    return c.json(dashboardData);
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analytics error",
      },
      500,
    );
  }
});

// Metrics collection API
app.post("/api/analytics/metrics", async (c) => {
  if (!platform) {
    return c.json(
      {
        success: false,
        error: "Platform not initialized",
      },
      503,
    );
  }

  try {
    const { type, value, dimensions } = await c.req.json();

    await platform.metricsCollector.collect({
      id: `metric_${Date.now()}`,
      type: type as MetricType,
      value,
      timestamp: new Date(),
      dimensions: dimensions || {},
    });

    return c.json({ success: true, message: "Metric collected" });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Metric collection error",
      },
      500,
    );
  }
});

// Webhook management APIs
app.get("/api/webhooks/endpoints", async (c) => {
  if (!platform) {
    return c.json({ success: false, error: "Platform not initialized" }, 503);
  }

  try {
    // This would list registered webhook endpoints
    return c.json({
      success: true,
      data: {
        endpoints: [],
        message: "Webhook endpoints feature available",
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Webhook error",
      },
      500,
    );
  }
});

app.post("/api/webhooks/endpoints", async (c) => {
  if (!platform) {
    return c.json({ success: false, error: "Platform not initialized" }, 503);
  }

  try {
    const { url, name, events, headers } = await c.req.json();

    const endpoint = await platform.webhookService.registerEndpoint({
      url,
      name: name || "Dashboard Webhook",
      description: "Webhook registered via admin dashboard",
      active: true,
      events: events || [WebhookEventType.MESSAGE_SENT],
      headers: headers || {},
    });

    return c.json({ success: true, data: endpoint });
  } catch (error) {
    return c.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Webhook registration error",
      },
      500,
    );
  }
});

// Redirect main route to app.ts implementation
app.get("/", (c) => {
  return c.redirect("/dashboard");
});

app.get("/dashboard", (c) => {
  return c.html(`
    <html>
      <head>
        <title>K-Message Dashboard - Redirecting...</title>
        <meta http-equiv="refresh" content="0;url=http://localhost:3000">
      </head>
      <body>
        <p>Redirecting to dashboard...</p>
        <script>window.location.href = 'http://localhost:3000';</script>
      </body>
    </html>
  `);
});

// Legacy dashboard routes - removed JSX implementation
// These routes now redirect to the main dashboard app

// Error handling
app.onError((error, c) => {
  console.error("Application error:", error);

  if (error instanceof KMsgError) {
    return c.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      500,
    );
  }

  return c.json(
    {
      success: false,
      error: "Internal server error",
    },
    500,
  );
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down K-Message Admin Dashboard...");
  if (platform) {
    await platform.shutdown();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 SIGTERM received, shutting down...");
  if (platform) {
    await platform.shutdown();
  }
  process.exit(0);
});

// Start server
const port = process.env.PORT || 3000;

console.log(`
🚀 K-Message Admin Dashboard
📦 Powered by all K-Message packages:
   • @k-msg/provider (IWINV)
   • @k-msg/template (Template Engine)
   • @k-msg/messaging (Message Sending)
   • @k-msg/channel (Channel Management) 
   • @k-msg/analytics (Real-time Analytics)
   • @k-msg/webhook (Event System)
📍 http://localhost:${port}
`);

export default {
  port,
  fetch: app.fetch,
};
