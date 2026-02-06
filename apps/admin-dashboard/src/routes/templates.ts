import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { TemplateCategory, TemplateStatus } from '@k-msg/template';
import { KMsgError } from '@k-msg/core';

// Platform interface for templates
interface KMessagePlatform {
  templateService: any;
  provider: any;
}

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(1000),
  category: z.enum(['AUTHENTICATION', 'NOTIFICATION', 'PROMOTION', 'INFORMATION', 'RESERVATION', 'SHIPPING', 'PAYMENT']),
  variables: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean()
  })).optional()
});

export function templatesRouter(platform: KMessagePlatform) {
  const app = new Hono();

  // Create template
  app.post('/', zValidator('json', createTemplateSchema), async (c) => {
    try {
      const data = c.req.valid('json');

      const template = await platform.templateService.createTemplate({
        name: data.name,
        code: `template_${Date.now()}`,
        content: data.content,
        category: TemplateCategory[data.category],
        status: TemplateStatus.PENDING,
        provider: 'iwinv',
        variables: data.variables || []
      });

      return c.json({
        success: true,
        data: template
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  });

  // Validate template
  app.post('/validate', zValidator('json', z.object({
    content: z.string()
  })), async (c) => {
    try {
      const { content } = c.req.valid('json');

      const variables = platform.templateService.parseVariables ? 
        platform.templateService.parseVariables(content) : 
        [];

      return c.json({
        success: true,
        data: {
          variables,
          isValid: true
        }
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  });

  // Get template variables
  app.post('/variables', zValidator('json', z.object({
    content: z.string()
  })), (c) => {
    try {
      const { content } = c.req.valid('json');
      const variables = platform.templateService.parseVariables ? 
        platform.templateService.parseVariables(content) : 
        [];

      return c.json({
        success: true,
        data: { variables }
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  });

  return app;
}