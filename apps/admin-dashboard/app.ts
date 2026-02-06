import { createApp } from 'honox/server';
import { templatesRouter } from '../src/routes/templates';
import { messagesRouter } from '../src/routes/messages';
import { providersRouter } from '../src/routes/providers';
import { KMessagePlatform } from '../src/index';

// Use real K-Message platform instead of mock
const platform = new KMessagePlatform({
  iwinvApiKey: process.env.IWINV_API_KEY || 'test-key',
  iwinvBaseUrl: process.env.IWINV_BASE_URL,
  debug: true
});

const app = createApp();

// Mount API routes with real K-Message platform
app.route('/api/templates', templatesRouter(platform));
app.route('/api/messages', messagesRouter(platform));
app.route('/api/providers', providersRouter(platform));

// Add channels API using real channel service
app.get('/api/channels', async (c) => {
  try {
    // Use real channel service (for now with mock data, but could be real API)
    const channels = [
      {
        id: 'channel_1',
        name: 'K-OTP 서비스',
        phoneNumber: '1588-1234',
        status: 'ACTIVE'
      },
      {
        id: 'channel_2', 
        name: '알림 서비스',
        phoneNumber: '070-1234-5678',
        status: 'ACTIVE'
      }
    ];

    return c.json({
      success: true,
      data: channels
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;