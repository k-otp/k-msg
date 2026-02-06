/**
 * Kakao Business API Integration
 * Provides structure for future Kakao Business API implementation
 */

export interface KakaoBusinessConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  environment: 'development' | 'production';
  timeout?: number;
  debug?: boolean;
}

// Kakao Business API 응답 타입
export interface KakaoBusinessResponse<T = any> {
  result_code: string;
  result_msg: string;
  data?: T;
}

export interface KakaoPlusFriend {
  uuid: string;
  phone_number: string;
  profile_nickname: string;
  profile_image?: string;
  status: 'ACTIVE' | 'BLOCK' | 'DORMANT';
  regdate: string;
  categories: string[];
}

export interface KakaoTemplate {
  template_code: string;
  template_name: string;
  template_content: string;
  template_message_type: 'BA' | 'EX' | 'AD' | 'MI';
  template_emphasis_type?: 'NONE' | 'TEXT' | 'IMAGE';
  template_status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'STOP';
  buttons?: KakaoTemplateButton[];
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_reason?: string;
}

export interface KakaoTemplateButton {
  type: 'WL' | 'AL' | 'DS' | 'BK' | 'MD' | 'BC' | 'BT' | 'AC';
  name: string;
  link_mobile?: string;
  link_pc?: string;
  scheme_ios?: string;
  scheme_android?: string;
  chat_event?: string;
  plugin_id?: string;
  relay_id?: string;
}

export interface KakaoChannelRegistration {
  phone_number: string;
  business_name: string;
  business_registration_number: string;
  representative_name: string;
  business_type: string;
  business_category: string;
  contact_phone: string;
  contact_email: string;
  homepage_url?: string;
  address: string;
}

/**
 * Kakao Business API Client
 *
 * Note: This is a structure for future implementation.
 * Actual Kakao Business API integration requires:
 * 1. Kakao Business account setup
 * 2. API key registration
 * 3. Business verification process
 * 4. Contract agreement with Kakao
 */
export class KakaoBusinessApiClient {
  constructor(private config: KakaoBusinessConfig) {}

  /**
   * 플러스친구 등록
   * 실제 구현시 Kakao Business API 연동 필요
   */
  async registerPlusFriend(registration: KakaoChannelRegistration): Promise<KakaoPlusFriend> {
    // TODO: 실제 Kakao Business API 연동
    throw new Error('Kakao Business API integration not implemented. Please contact Kakao Business for API access.');
  }

  /**
   * 플러스친구 목록 조회
   */
  async getPlusFriends(): Promise<KakaoPlusFriend[]> {
    try {
      const response = await this.makeRequest<KakaoPlusFriend[]>('GET', '/plusfriends');
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get plus friends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 템플릿 등록
   */
  async createTemplate(template: Omit<KakaoTemplate, 'template_code' | 'template_status' | 'created_at' | 'updated_at'>): Promise<KakaoTemplate> {
    try {
      const response = await this.makeRequest<KakaoTemplate>('POST', '/templates', template);

      if (!response.data) {
        throw new Error('Template creation failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 템플릿 목록 조회
   */
  async getTemplates(status?: string): Promise<KakaoTemplate[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await this.makeRequest<KakaoTemplate[]>('GET', `/templates${params}`);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 템플릿 수정
   */
  async updateTemplate(templateCode: string, updates: Partial<KakaoTemplate>): Promise<KakaoTemplate> {
    try {
      const response = await this.makeRequest<KakaoTemplate>('PUT', `/templates/${templateCode}`, updates);

      if (!response.data) {
        throw new Error('Template update failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 템플릿 삭제
   */
  async deleteTemplate(templateCode: string): Promise<void> {
    try {
      await this.makeRequest('DELETE', `/templates/${templateCode}`);
    } catch (error) {
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * AlimTalk 메시지 발송
   */
  async sendMessage(message: {
    plus_friend_id: string;
    template_code: string;
    phone_number: string;
    template_param: Record<string, string>;
    button_param?: Record<string, string>;
    resend_param?: {
      is_resend: boolean;
      resend_type?: 'SMS' | 'LMS';
      resend_title?: string;
      resend_content?: string;
    };
  }): Promise<{ request_id: string; result_code: string }> {
    try {
      const response = await this.makeRequest<{ request_id: string; result_code: string }>('POST', '/messages', message);

      if (!response.data) {
        throw new Error('Message send failed');
      }

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 발송 결과 조회
   */
  async getMessageResult(requestId: string): Promise<{
    request_id: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILURE';
    result_code: string;
    result_message: string;
    sent_at?: string;
    delivered_at?: string;
  }> {
    try {
      const response = await this.makeRequest(`GET`, `/messages/${requestId}/result`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get message result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequest<T = any>(method: string, endpoint: string, data?: any): Promise<KakaoBusinessResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.secretKey) {
      headers['X-Secret-Key'] = this.config.secretKey;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: this.config.timeout ? AbortSignal.timeout(this.config.timeout) : undefined,
    });

    const responseText = await response.text();

    if (this.config.debug) {
      console.log(`Kakao API ${method} ${endpoint}:`, responseText.substring(0, 500));
    }

    let result: KakaoBusinessResponse<T>;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!response.ok || result.result_code !== '0') {
      throw new Error(`Kakao API error: ${result.result_msg || 'Unknown error'}`);
    }

    return result;
  }
}

/**
 * 카카오 비즈니스 등록 가이드
 */
export const KakaoBusinessRegistrationGuide = {
  provider: 'kakao-business',
  steps: [
    {
      step: 1,
      title: '카카오 비즈니스 계정 생성',
      description: '카카오 비즈니스 센터에서 계정을 생성하세요',
      action: 'external' as const,
      externalUrl: 'https://center-pf.kakao.com/'
    },
    {
      step: 2,
      title: '사업자 인증',
      description: '사업자등록증과 담당자 정보를 등록하여 인증을 받으세요',
      action: 'external' as const,
      externalUrl: 'https://center-pf.kakao.com/profiles'
    },
    {
      step: 3,
      title: '플러스친구 등록',
      description: 'AlimTalk 서비스를 위한 플러스친구를 등록하세요',
      action: 'external' as const,
      externalUrl: 'https://center-pf.kakao.com/profiles'
    },
    {
      step: 4,
      title: 'API 키 발급',
      description: 'AlimTalk API 사용을 위한 키를 발급받으세요',
      action: 'external' as const,
      externalUrl: 'https://center-pf.kakao.com/profiles'
    },
    {
      step: 5,
      title: '계약 체결',
      description: '카카오와 AlimTalk 서비스 이용 계약을 체결하세요',
      action: 'external' as const,
      externalUrl: 'https://center-pf.kakao.com/'
    }
  ],
  requirements: [
    {
      type: 'document' as const,
      name: '사업자등록증',
      description: '법인 또는 개인사업자 등록증',
      required: true,
      format: 'PDF, JPG, PNG'
    },
    {
      type: 'business_info' as const,
      name: '사업자 정보',
      description: '사업자명, 대표자명, 사업장 주소 등',
      required: true
    },
    {
      type: 'contact' as const,
      name: '담당자 정보',
      description: '담당자 이름, 연락처, 이메일',
      required: true
    }
  ],
  webhookSupport: {
    supported: true,
    events: [
      'template.approved',
      'template.rejected',
      'message.delivered',
      'message.failed',
      'channel.verified'
    ],
    setupInstructions: 'Kakao Business Center에서 웹훅 URL을 설정하세요',
    callbackUrls: [
      '/webhooks/kakao/template-status',
      '/webhooks/kakao/message-status',
      '/webhooks/kakao/channel-status'
    ]
  }
};