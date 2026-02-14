import { Hono } from "hono";

// Platform interface for providers
interface KMessagePlatform {
  provider: any;
  getInfo(): any;
  healthCheck(): Promise<any>;
}

export function providersRouter(platform: KMessagePlatform) {
  const app = new Hono();

  // List providers
  app.get("/", (c) => {
    try {
      const info = platform.getInfo();
      return c.json({
        success: true,
        data: {
          provider: info.provider,
          features: info.features,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  });

  // Get provider capabilities
  app.get("/:providerId/capabilities", (c) => {
    try {
      const providerId = c.req.param("providerId");

      if (providerId !== platform.provider.id) {
        return c.json(
          {
            success: false,
            error: `Provider '${providerId}' not found`,
          },
          404,
        );
      }

      return c.json({
        success: true,
        data: {
          id: platform.provider.id,
          name: platform.provider.name,
          capabilities: platform.provider.capabilities,
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  });

  // Provider health check
  app.get("/health", async (c) => {
    try {
      const health = await platform.healthCheck();

      return c.json({
        success: true,
        data: health,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  });

  // Individual provider health
  app.get("/:providerId/health", async (c) => {
    try {
      const providerId = c.req.param("providerId");
      const health = await platform.healthCheck();

      if (providerId !== platform.provider.id) {
        return c.json(
          {
            success: false,
            error: `Provider '${providerId}' not found`,
          },
          404,
        );
      }

      const providerHealth = health.provider.healthy;

      return c.json({
        success: true,
        data: {
          provider: providerId,
          healthy: providerHealth,
          issues: health.provider.issues || [],
        },
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
      );
    }
  });

  return app;
}
