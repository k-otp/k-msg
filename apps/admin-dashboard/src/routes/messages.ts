import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Platform interface for messages
interface KMessagePlatform {
  kmsg: any;
  bulkSender: any;
  provider: any;
}

const sendMessageSchema = z.object({
  templateId: z.string().min(1),
  phoneNumber: z.string().regex(/^[0-9]{10,11}$/),
  variables: z.record(z.union([z.string(), z.number(), z.date()]))
});

const sendBulkSchema = z.object({
  templateId: z.string().min(1),
  recipients: z.array(z.object({
    phoneNumber: z.string().regex(/^[0-9]{10,11}$/),
    variables: z.record(z.union([z.string(), z.number(), z.date()])).optional()
  })),
  variables: z.record(z.union([z.string(), z.number(), z.date()])).optional()
});

export function messagesRouter(platform: KMessagePlatform) {
  const app = new Hono();

  // Send single message
  app.post('/send', zValidator('json', sendMessageSchema), async (c) => {
    try {
      const data = c.req.valid('json');
      
      const result = await platform.provider.sendMessage({
        templateCode: data.templateId,
        phoneNumber: data.phoneNumber,
        variables: data.variables
      });

      return c.json({
        success: true,
        data: result
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  });

  // Send bulk messages
  app.post('/send/bulk', zValidator('json', sendBulkSchema), async (c) => {
    try {
      const data = c.req.valid('json');
      
      const result = await platform.bulkSender.sendBulk({
        templateId: data.templateId,
        recipients: data.recipients.map(r => ({
          phoneNumber: r.phoneNumber,
          variables: { ...data.variables, ...r.variables }
        })),
        options: {
          batchSize: 10,
          batchDelay: 1000
        }
      });

      return c.json({
        success: true,
        data: result
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  });

  // Get message status
  app.get('/status/:messageId', async (c) => {
    try {
      const messageId = c.req.param('messageId');
      // Use provider's history API to get message status
      const status = 'unknown'; // Placeholder - would need provider implementation

      return c.json({
        success: true,
        data: { status }
      });

    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  });

  // Cancel message
  app.delete('/:messageId', async (c) => {
    try {
      const messageId = c.req.param('messageId');
      // Use provider's cancel API
      const result = await platform.provider.cancelReservation ? 
        platform.provider.cancelReservation(parseInt(messageId)) :
        { success: false, message: 'Cancel not supported' };

      return c.json({
        success: true,
        message: 'Message cancelled successfully'
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