import { Hono } from 'hono';
import { IWINVProvider } from 'k-msg';

// 간단한 K-Message 서비스 클래스 (실제 작동 가능한 버전)
class KMessageService {
  private provider: IWINVProvider;
  private templates: Map<string, any> = new Map();
  private messages: Array<any> = [];
  private channels: Array<any> = [];
  private providerTemplates: Array<any> = [];
  private isLoaded = false;

  constructor(config: {
    iwinvApiKey: string;
    iwinvBaseUrl?: string;
    debug?: boolean;
  }) {
    // Provider 초기화
    this.provider = new IWINVProvider({
      apiKey: config.iwinvApiKey,
      baseUrl: config.iwinvBaseUrl || 'https://alimtalk.bizservice.iwinv.kr',
      debug: config.debug || false
    });

    console.log('✅ K-Message Service initialized with IWINVProvider');
    
    // 초기화 시 데이터 로드
    this.loadProviderData();
  }

  // 프로바이더 데이터 로드
  async loadProviderData() {
    try {
      console.log('🔄 Loading provider data...');
      
      // 채널 정보 로드
      await this.loadChannels();
      
      // 기존 템플릿 로드
      await this.loadProviderTemplates();
      
      this.isLoaded = true;
      console.log('✅ Provider data loaded successfully');
    } catch (error) {
      console.warn('⚠️  Provider data loading failed:', error);
      this.isLoaded = false;
    }
  }

  // 채널 목록 로드
  async loadChannels() {
    try {
      const channels = await this.provider.channels.list();
      if (Array.isArray(channels)) {
        this.channels = channels;
        console.log(`📋 Loaded ${this.channels.length} channels`);
      } else {
        console.warn('Channels result is not an array:', channels);
        this.channels = [];
      }
    } catch (error) {
      console.warn('Channel loading failed:', error);
      this.channels = [];
    }
  }

  // 프로바이더 템플릿 로드
  async loadProviderTemplates() {
    try {
      const templates = await this.provider.templates.list();
      if (Array.isArray(templates)) {
        this.providerTemplates = templates;
        console.log(`📋 Loaded ${this.providerTemplates.length} provider templates`);
      } else {
        console.warn('Templates result is not an array:', templates);
        this.providerTemplates = [];
      }
    } catch (error) {
      console.warn('Provider template loading failed:', error);
      this.providerTemplates = [];
    }
  }

  // 헬스 체크
  async healthCheck() {
    try {
      const providerHealth = await this.provider.healthCheck();
      return {
        status: 'healthy',
        provider: providerHealth.healthy,
        services: {
          template: true,
          delivery: true,
          analytics: true
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // 템플릿 생성
  async createTemplate(name: string, content: string, category: string) {
    try {
      // 1. 템플릿 변수 자동 파싱
      const variables = this.parseTemplateVariables(content);

      // 2. 로컬 저장
      const template = {
        id: `template_${Date.now()}`,
        name,
        content,
        category,
        variables,
        status: 'created',
        createdAt: new Date().toISOString()
      };

      this.templates.set(name, template);

      // 3. Provider에도 등록 시도
      try {
        await this.provider.createTemplate(name, content, category, variables);
        console.log(`✅ Template '${name}' created in provider`);
      } catch (providerError) {
        console.warn('Provider template creation failed:', providerError);
      }

      return {
        success: true,
        template
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Template creation failed'
      };
    }
  }

  // 메시지 발송
  async sendMessage(phoneNumber: string, templateName: string, variables: Record<string, any>) {
    try {
      // 1. 메시지 발송 요청
      const result = await this.provider.sendMessage({
        templateCode: templateName,
        phoneNumber,
        variables
      });

      // 2. 로컬 메시지 로그 저장
      const messageLog = {
        id: `msg_${Date.now()}`,
        phoneNumber,
        templateName,
        variables,
        result,
        sentAt: new Date().toISOString()
      };
      this.messages.push(messageLog);

      return {
        success: !!result.messageId,
        messageId: result.messageId,
        status: result.messageId ? 'sent' : 'failed',
        error: result.messageId ? undefined : result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Message send failed'
      };
    }
  }

  // 템플릿 목록 조회 (로컬 + 프로바이더)
  async listTemplates(source: 'local' | 'provider' | 'all' = 'all') {
    try {
      const result: any = {
        success: true,
        isLoaded: this.isLoaded
      };

      if (source === 'local' || source === 'all') {
        result.localTemplates = Array.from(this.templates.values());
      }

      if (source === 'provider' || source === 'all') {
        result.providerTemplates = this.providerTemplates;
      }

      if (source === 'all') {
        result.templates = [
          ...Array.from(this.templates.values()).map(t => ({ ...t, source: 'local' })),
          ...this.providerTemplates.map(t => ({ ...t, source: 'provider' }))
        ];
      } else {
        result.templates = source === 'local' ? result.localTemplates : result.providerTemplates;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list templates'
      };
    }
  }

  // 채널 목록 조회
  async listChannels() {
    try {
      return {
        success: true,
        channels: this.channels,
        isLoaded: this.isLoaded
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list channels'
      };
    }
  }

  // 프로바이더 데이터 새로고침
  async refreshProviderData() {
    await this.loadProviderData();
    return {
      success: true,
      message: 'Provider data refreshed',
      isLoaded: this.isLoaded
    };
  }

  // Analytics 조회
  async getAnalytics() {
    try {
      const totalMessages = this.messages.length;
      const successfulMessages = this.messages.filter(m => m.result.messageId).length;
      const successRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;

      return {
        success: true,
        analytics: {
          messagesSent: totalMessages,
          successfulMessages,
          successRate: Math.round(successRate * 100) / 100,
          templates: this.templates.size
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics unavailable'
      };
    }
  }

  // 헬퍼: 템플릿 변수 파싱
  private parseTemplateVariables(content: string) {
    const matches = content.match(/#{([^}]+)}/g) || [];
    return matches.map((match: string) => ({
      name: match.slice(2, -1),
      type: 'string' as const,
      required: true
    })).filter((v, index, self) =>
      index === self.findIndex(item => item.name === v.name)
    );
  }
}

// 환경 변수 설정
const config = {
  iwinvApiKey: process.env.IWINV_API_KEY || 'test-key',
  iwinvBaseUrl: process.env.IWINV_BASE_URL,
  debug: process.env.NODE_ENV !== 'production'
};

// K-Message 서비스 초기화
const kmsgService = new KMessageService(config);

// Hono 앱 생성
const app = new Hono();

// 헬스 체크
app.get('/health', async (c) => {
  const health = await kmsgService.healthCheck();
  return c.json(health);
});

// 템플릿 생성
app.post('/templates', async (c) => {
  const body = await c.req.json();
  const { name, content, category } = body;

  if (!name || !content || !category) {
    return c.json({
      success: false,
      error: 'Missing required fields: name, content, category'
    }, 400);
  }

  const result = await kmsgService.createTemplate(name, content, category);
  return c.json(result);
});

// 템플릿 목록 조회 (쿼리 파라미터로 소스 선택)
app.get('/templates', async (c) => {
  const source = c.req.query('source') as 'local' | 'provider' | 'all' || 'all';
  const result = await kmsgService.listTemplates(source);
  return c.json(result);
});

// 채널 목록 조회
app.get('/channels', async (c) => {
  const result = await kmsgService.listChannels();
  return c.json(result);
});

// 프로바이더 데이터 새로고침
app.post('/provider/refresh', async (c) => {
  const result = await kmsgService.refreshProviderData();
  return c.json(result);
});

// 메시지 발송
app.post('/messages/send', async (c) => {
  const body = await c.req.json();
  const { phoneNumber, templateName, variables } = body;

  if (!phoneNumber || !templateName) {
    return c.json({
      success: false,
      error: 'Missing required fields: phoneNumber, templateName'
    }, 400);
  }

  const result = await kmsgService.sendMessage(phoneNumber, templateName, variables || {});
  return c.json(result);
});

// Analytics 조회
app.get('/analytics', async (c) => {
  const result = await kmsgService.getAnalytics();
  return c.json(result);
});

// 서버 시작
const port = process.env.PORT ? parseInt(process.env.PORT) : 3002;

console.log(`🚀 K-Message Service starting on port ${port}`);
console.log(`📦 Using packages: core, provider, template, messaging, analytics`);

// Bun serve configuration
export default {
  port,
  fetch: app.fetch,
  development: process.env.NODE_ENV !== 'production'
};