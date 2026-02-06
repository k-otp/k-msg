/**
 * K-Message 공통 모듈 사용 예시
 * Provider별 예외사항을 처리하는 다양한 방법 소개
 */

import { MessageServiceFactory, IWINVProvider, BaseMessageService } from 'k-msg';

// === 예시 1: 가장 간단한 방법 ===
console.log('\n=== 예시 1: 간단한 사용법 ===');

const simpleService = MessageServiceFactory.createIWINVService({
  apiKey: process.env.IWINV_API_KEY || 'test-key',
  baseUrl: process.env.IWINV_BASE_URL,
  debug: true
});

// 자동으로 채널과 템플릿이 로드됨
// simpleService.getTemplates() // 바로 사용 가능

// === 예시 2: 세밀한 제어가 필요한 경우 ===
console.log('\n=== 예시 2: 세밀한 제어 ===');

const provider = new IWINVProvider({
  apiKey: process.env.IWINV_API_KEY || 'test-key',
  baseUrl: process.env.IWINV_BASE_URL || 'https://alimtalk.bizservice.iwinv.kr',
  debug: true
});

const advancedService = MessageServiceFactory.createService(provider, {
  debug: true,
  autoLoad: false, // 수동 로딩
  customHandlers: {
    // 커스텀 템플릿 로더 (예외 처리 강화)
    templateLoader: async (provider) => {
      try {
        console.log('🔄 Custom template loader executing...');
        const templates = await provider.templates.list();
        
        // IWINV 특화 후처리
        return templates.map(template => ({
          ...template,
          // 커스텀 필드 추가
          hasVariables: template.content.includes('#{'),
          variableCount: (template.content.match(/#{([^}]+)}/g) || []).length,
          isKorean: /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(template.content)
        }));
      } catch (error) {
        console.warn('Custom template loader failed, using fallback');
        return [];
      }
    },

    // 커스텀 에러 핸들러
    errorHandler: (error, context) => {
      console.error(`🚨 [${context}] ${error.message}`);
      
      // 특정 에러에 대한 복구 로직
      if (error.message.includes('timeout')) {
        console.log('⚡ Implementing retry logic for timeout...');
      }
    }
  },
  
  // Provider별 특화 설정
  providerSpecific: {
    iwinv: {
      templateCategories: ['AUTHENTICATION', 'NOTIFICATION'],
      maxVariables: 10,
      enableBulkSending: false
    }
  }
});

// 수동 로딩
advancedService.loadProviderData();

// === 예시 3: 다중 Provider 환경 (향후 지원) ===
console.log('\n=== 예시 3: 다중 Provider 환경 (미래 계획) ===');

// 향후 이런 식으로 여러 Provider를 동시에 사용 가능
/*
const multiProviderService = new MultiProviderMessageService({
  providers: {
    primary: new IWINVProvider({ ... }),
    fallback: new KakaoBusinessProvider({ ... }),
    sms: new NaverSMSProvider({ ... })
  },
  routingRules: {
    alimtalk: 'primary',
    sms: 'sms',
    fallback: 'fallback'
  }
});
*/

// === 예시 4: Provider 별 기본 설정 확인 ===
console.log('\n=== 예시 4: Provider 설정 정보 ===');

const iwinvDefaults = MessageServiceFactory.getProviderDefaults('iwinv');
console.log('IWINV 기본 설정:', JSON.stringify(iwinvDefaults, null, 2));

// === 예시 5: 실제 사용 패턴 ===
console.log('\n=== 예시 5: 실제 사용 패턴 ===');

async function demonstrateUsage() {
  try {
    // 서비스 생성
    const service = MessageServiceFactory.createIWINVService({
      apiKey: process.env.IWINV_API_KEY || 'test-key',
      debug: true
    });

    // 잠시 대기 (자동 로딩 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1. 템플릿 조회
    const templates = service.getTemplates('provider');
    console.log(`📋 Available templates: ${templates.templates?.length || 0}`);

    // 2. 새 템플릿 생성
    const newTemplate = await service.createTemplate(
      'welcome_msg',
      '안녕하세요 #{name}님! 가입을 환영합니다.',
      'AUTHENTICATION'
    );
    console.log('📝 Template created:', newTemplate.success);

    // 3. 메시지 발송
    if (newTemplate.success) {
      const sendResult = await service.sendMessage(
        '01012345678',
        'welcome_msg',
        { name: '홍길동' }
      );
      console.log('📤 Message sent:', sendResult.success);
    }

    // 4. 분석 데이터 확인
    const analytics = await service.getAnalytics();
    console.log('📊 Analytics:', analytics.analytics);

    // 5. 헬스 체크
    const health = await service.healthCheck();
    console.log('💚 Service health:', health.status);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// 실제 실행은 주석 처리 (예시용)
// demonstrateUsage();

export { demonstrateUsage };